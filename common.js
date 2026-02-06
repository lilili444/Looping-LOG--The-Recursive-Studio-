// common.js
const STORAGE_KEY = 'ghostMessages';
const PAGE_CONFIG = {
  normalPages: ['1notion.html', '2email.html', '3figma.html', '4p5js.html', '5chatgpt.html', '6words.html', '7canvas.html', '8miro.html'],
  errorPage: 'error.html',
  errorProbability: 0.1, // 10%基础概率
  maxHistory: 2 // 记忆最近访问页数
};


function initGhost() {
  let isProcessingInput = false; // 防止输入框快速重复提交
  let messageQueue = [];         // 新增：消息队列
  let isTypingSystemActive = false; // 新增：标记打字系统是否正在活动（播放动画）
  let isUserMessageCurrentlyTyping = false; // 标记当前播放的是否为用户消息

  // --- DOM 元素创建 和 文本节点获取 (与之前类似) ---
  const createTypingElement = () => {
    const typingSpan = document.createElement('span');
    typingSpan.className = 'typing-section';
    const textSpan = document.createElement('span');
    textSpan.className = 'typed-text';
    typingSpan.appendChild(textSpan);
    return typingSpan;
  };

  const getTextNodes = (element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  };

  const insertTyping = () => {
    // ... (insertTyping 函数与您之前版本中的实现基本相同)
    // ... (确保它能正确找到容器、段落，并插入打字动画的span元素)
    const ghostContainer = document.querySelector('.ghost-container');
    if (!ghostContainer) {
      console.error("Ghost container not found in insertTyping.");
      return null;
    }

    const paragraphs = Array.from(ghostContainer.querySelectorAll('.container p'))
      .filter(p => !p.closest('.input-section'));

    if (paragraphs.length === 0) {
      console.error("No suitable paragraphs found in insertTyping.");
      return null;
    }

    const targetPara = paragraphs[Math.floor(Math.random() * paragraphs.length)];
    const textContent = targetPara.textContent || ""; // Ensure textContent is a string

    // 如果段落内容太短，直接附加而不是尝试分割
    if (textContent.length < 20 && textContent.length > 0) {
        const typingElementShort = createTypingElement();
        targetPara.appendChild(typingElementShort);
         return {
            container: typingElementShort,
            textElement: typingElementShort.querySelector('.typed-text')
        };
    } else if (textContent.length === 0) { // 如果段落为空，也直接附加
        const typingElementEmpty = createTypingElement();
        targetPara.appendChild(typingElementEmpty);
         return {
            container: typingElementEmpty,
            textElement: typingElementEmpty.querySelector('.typed-text')
        };
    }


    let splitIndex = Math.floor(Math.random() * (textContent.length - Math.min(20, textContent.length -1) )) + 10;
    splitIndex = Math.min(splitIndex, textContent.length -1); // Ensure splitIndex is within bounds
    splitIndex = Math.max(splitIndex, 0); // Ensure splitIndex is not negative

    // 确保分割点在单词边界（如果可能）
    let attempts = 0;
    while (splitIndex < textContent.length && textContent[splitIndex] !== ' ' && attempts < 10) {
         splitIndex++; attempts++;
    }
    if (attempts >= 10 && splitIndex > 0) { // Fallback if no space found quickly
        attempts = 0;
        while (splitIndex > 0 && textContent[splitIndex-1] !== ' ' && attempts < 10) {
            splitIndex--; attempts++;
        }
    }


    const textNodes = getTextNodes(targetPara);
    let count = 0, targetNode = null, nodeIndex = 0;

    for (const node of textNodes) {
      if (count + node.length >= splitIndex) {
        targetNode = node;
        nodeIndex = splitIndex - count;
        break;
      }
      count += node.length;
    }

    if (!targetNode) { // 如果找不到目标文本节点（例如段落只有图片或空文本节点）
        console.warn("No suitable text node found for splitting, appending to paragraph.");
        const typingElementFallback = createTypingElement();
        targetPara.appendChild(typingElementFallback);
        return {
            container: typingElementFallback,
            textElement: typingElementFallback.querySelector('.typed-text')
        };
    }
    
    // 确保 nodeIndex 在 targetNode 的长度范围内
    nodeIndex = Math.max(0, Math.min(nodeIndex, targetNode.length));

    const remainingText = targetNode.splitText(nodeIndex);
    const typingElement = createTypingElement();
    targetNode.parentNode.insertBefore(typingElement, remainingText);

    return {
      container: typingElement,
      textElement: typingElement.querySelector('.typed-text')
    };
  };


  // --- 消息定义 (与之前类似) ---
  const presetMessages = [
    "I have to finish this.", "The deadline is closed.", "I need to work.",
    "Nothing difficult.", "I can't breathe."
  ];
  const userMessagesFromStorage = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let weightedMessages = [ // 使用 let 以便未来可能动态更新
    ...presetMessages,
    ...userMessagesFromStorage.flatMap(msg => Array(3).fill(msg)) // 用户消息权重增加
  ];
  if (weightedMessages.length === 0) { // 确保总有消息可选
      weightedMessages.push("...");
  }


  // --- 打字动画变量 (与之前类似) ---
  let currentTyping = null;    // 当前正在打字的DOM元素 ({ container, textElement })
  let currentMessage = "";     // 当前正在打字的完整消息文本
  let charIndex = 0;           // 当前打字到第几个字符

  // --- 前向声明核心函数 ---
  let typeLoop;
  let eraseLoop;
  let processNextMessageFromQueue;

  // --- 新的辅助函数：拾取一条随机的幽灵消息 ---
  const pickNewGhostMessageObject = () => {
    return {
      text: weightedMessages[Math.floor(Math.random() * weightedMessages.length)],
      isUser: false // 标记为非用户消息
    };
  };

  // --- 核心调度函数：处理队列中的下一条消息 ---
  processNextMessageFromQueue = () => {
    if (isTypingSystemActive) {
      // 如果系统已激活（正在打字/擦除），则不应执行此操作，等待当前周期结束
      // console.warn("processNextMessageFromQueue called while system is already active.");
      return;
    }

    if (messageQueue.length === 0) {
      // 队列为空，添加一条新的幽灵消息
      messageQueue.push(pickNewGhostMessageObject());
    }

    const messageToProcess = messageQueue.shift(); // 从队列头部取出消息
    if (!messageToProcess) { // 以防万一队列操作出问题
        isTypingSystemActive = false;
        setTimeout(processNextMessageFromQueue, 500); // 稍后重试
        return;
    }

    currentMessage = messageToProcess.text;
    isUserMessageCurrentlyTyping = messageToProcess.isUser;

    // 为每条消息（用户或幽灵）获取新的显示位置
    if (currentTyping?.container) {
      currentTyping.container.remove(); // 移除上一个消息的DOM元素
    }
    currentTyping = insertTyping(); // 插入新的DOM元素用于打字

    if (!currentTyping?.textElement) {
      console.error("Failed to insert typing element. Re-queuing message.");
      messageQueue.unshift(messageToProcess); // 将消息放回队列头部
      isTypingSystemActive = false;           // 标记系统为非活动
      setTimeout(processNextMessageFromQueue, 1000); // 稍后重试
      return;
    }

    // 根据是否用户消息应用样式
    if (isUserMessageCurrentlyTyping) {
      currentTyping.container.classList.add('user-underline');
    } else {
      currentTyping.container.classList.remove('user-underline'); // 确保幽灵消息没有下划线
    }

    charIndex = 0;
    currentTyping.textElement.textContent = ""; // 清空准备打字
    isTypingSystemActive = true;               // 标记系统进入活动状态
    setTimeout(typeLoop, Math.random() * 100 + 50); // 短暂延迟后开始打字
  };


  // --- 打字和擦除循环 (与之前类似，但结尾调用 processNextMessageFromQueue) ---
  typeLoop = () => {
    if (!currentTyping?.textElement || !currentTyping.container.isConnected) {
      isTypingSystemActive = false; // 意外中断，标记为非活动
      console.warn("Typing element lost. Attempting to process next message.");
      setTimeout(processNextMessageFromQueue, 500); // 尝试处理下一条
      return;
    }

    if (charIndex < currentMessage.length) {
      currentTyping.textElement.textContent += currentMessage[charIndex];
      charIndex++;
      setTimeout(typeLoop, Math.random() * 100 + 50); // 打字速度
    } else {
      setTimeout(eraseLoop, 1500); // 打字完毕，等待后开始擦除
    }
  };

  eraseLoop = () => {
    if (!currentTyping?.textElement || !currentTyping.container.isConnected) {
      isTypingSystemActive = false; // 意外中断
      console.warn("Erasing element lost. Attempting to process next message.");
      setTimeout(processNextMessageFromQueue, 500);
      return;
    }

    if (charIndex > 0) {
      currentTyping.textElement.textContent = currentMessage.substring(0, charIndex - 1);
      charIndex--;
      setTimeout(eraseLoop, 50); // 擦除速度
    } else { // 擦除完毕
      isTypingSystemActive = false;       // 标记系统为非活动状态
      processNextMessageFromQueue();      // 处理队列中的下一条消息
    }
  };

  // --- 修改后的 handleInput ---
  const handleInput = (e) => {
    if (e.key === 'Enter') {
      if (isProcessingInput) return;

      const newMessageText = e.target.value.trim();
      if (newMessageText === '') {
        e.target.value = '';
        return;
      }
      isProcessingInput = true;

      const validation = validateInput(newMessageText); // 确保 validateInput 可用
      if (!validation.valid) {
        if (validation.reason === 'length') {
          alert(`字数超限！${validation.message}`);
        } else if (validation.reason === 'empty') {
          // 理论上 newMessageText 非空，但以防 validateInput 有其他 'empty' 逻辑
          console.log('Input was considered empty by validation.');
        }
        e.target.value = '';
        isProcessingInput = false;
        return;
      }

      // --- 输入有效 ---
      messageQueue.push({ text: newMessageText, isUser: true }); // 加入队列
      e.target.value = ''; // 清空输入框
      isProcessingInput = false;

      // 如果打字系统当前是空闲的（例如，队列为空且刚加入第一条），则主动启动它
      if (!isTypingSystemActive) {
        processNextMessageFromQueue();
      }
    }
  };

  // --- 事件监听器和实例清理 (与之前类似) ---
  const inputElement = document.getElementById('userInput');
  if (inputElement) {
    inputElement.removeEventListener('keydown', handleInput); // 清理旧监听器
    inputElement.addEventListener('keydown', handleInput);
  } else {
    console.error('错误：找不到 userInput 元素。');
    return; // 无法继续
  }

  if (window.ghostInstance) { // 清理可能存在的上一个实例
    clearTimeout(window.ghostInstance.timer);
    if (window.ghostInstance.inputElement && window.ghostInstance.handler) {
      window.ghostInstance.inputElement.removeEventListener('keydown', window.ghostInstance.handler);
    }
  }

  const ghostContainer = document.querySelector('.ghost-container');
  if (!ghostContainer) {
    console.error('错误：找不到幽灵容器元素 (ghost-container)。幽灵效果无法运行。');
    return;
  }

  window.ghostInstance = { // 保存当前实例信息
    timer: null, // 注意：当前的 setTimeout 循环不直接使用这个 timer
    inputElement,
    handler: handleInput
  };

  // --- 初始化启动打字系统 ---
  processNextMessageFromQueue(); // 替换旧的 startNewCycle() 调用

} // End of initGhost function



// 独立校验函数
function validateInput(text) {
  const processedText = text
    .replace(/[.,!?;:]\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (processedText === '') {
    return { valid: false, reason: 'empty' };
  }

  const words = processedText.split(' ');
  if (words.length > 30) {
    return {
      valid: false,
      reason: 'length',
      message: `最大允许30个单词 (当前输入: ${words.length}个)`
    };
  }

  return { valid: true };
}

// 随机跳转
// 修改后的跳转逻辑
function randomJump() {
  const { normalPages, errorPage, errorProbability } = PAGE_CONFIG;
  
  // 获取纯净的当前页名（移除查询参数）
  const currentPage = window.location.pathname.split('/').pop().split('?')[0];
  
  // ▼▼▼ 错误触发判断 ▼▼▼
  const shouldError = currentPage !== errorPage && 
    Math.random() < errorProbability;

  if(shouldError) {
    // 跳转到错误页（添加随机参数防缓存）
    window.location.href = `${errorPage}?err=${Date.now()}`;
    return;
  }

  // ▼▼▼ 正常跳转逻辑 ▼▼▼
  const availablePages = normalPages.filter(p => 
    p !== currentPage && !p.includes(errorPage)
  );
  
  // 如果所有页面都访问过，重置记录
  if(availablePages.length === 0) {
    sessionStorage.removeItem('visitedPages');
  }
  
  // 获取或初始化访问记录
  const visited = JSON.parse(sessionStorage.getItem('visitedPages') || '[]');
  const targetPages = availablePages.filter(p => !visited.includes(p));
  
  // 优先跳转未访问页面
  const finalPage = targetPages.length > 0 ? 
    targetPages[Math.floor(Math.random()*targetPages.length)] :
    availablePages[Math.floor(Math.random()*availablePages.length)];
  
  // 更新访问记录（最多记录最近3个）
  sessionStorage.setItem('visitedPages', 
    JSON.stringify([...visited.slice(-2), finalPage])
  );
  
  window.location.href = finalPage;
}