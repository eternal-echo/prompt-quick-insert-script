// ==UserScript==
// @name         ChatGPT Prompt Insert with Filter, Replace, and Fix Cursor Focus
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Insert prompt with dropdown suggestion in ChatGPT input box, with ESC to close, cursor management, and focus fix
// @author       Grimoire
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Prompt 列表，用户输入后将从这里筛选匹配的选项
    const prompts = [
        "/help: How to use the system",
        "/summarize: Summarize the conversation",
        "/explain: Explain this concept",
        "/translate: Translate to another language",
        "/code: Generate code for this",
        "/debug: Debug the issue you're facing"
    ];

    // 添加CSS样式，用于提示框
    const style = document.createElement('style');
    style.innerHTML = `
        #promptSuggestionBox {
            position: absolute;
            background-color: white;
            border: 1px solid #ccc;
            z-index: 9999;
            width: 100%;  /* 和输入框宽度一致 */
            font-size: 16px; /* 和ChatGPT一致 */
            border-radius: 8px; /* 设置圆角 */
            max-height: 200px;
            overflow-y: auto;   /* 超过最大高度时启用垂直滚动条 */
            display: none;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
        }
        .suggestion {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid #eee; /* 每个建议项之间加个细线 */
        }
        .suggestion:last-child {
            border-bottom: none; /* 去除最后一个的底部线条 */
        }
        .suggestion:hover, .suggestion.selected {
            background-color: #f1f1f1; /* Hover和选中时背景颜色 */
        }
    `;
    document.head.appendChild(style);

    // 创建提示框元素
    const suggestionBox = document.createElement('div');
    suggestionBox.id = 'promptSuggestionBox';
    document.body.appendChild(suggestionBox);

    // Function to display suggestions
    function showSuggestions(inputElement, suggestions) {
        suggestionBox.innerHTML = '';
        if (suggestions.length === 0) {
            suggestionBox.style.display = 'none';
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.classList.add('suggestion');
            suggestionDiv.textContent = suggestion;
            suggestionDiv.addEventListener('click', () => {
                insertPrompt(inputElement, suggestion);
            });
            suggestionBox.appendChild(suggestionDiv);
        });

        // 定位提示框到输入框的上方
        const rect = inputElement.getBoundingClientRect();
        suggestionBox.style.top = `${rect.top + window.scrollY - suggestionBox.offsetHeight}px`; // 上方显示
        suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        suggestionBox.style.width = `${rect.width}px`; // 和输入框同宽
        suggestionBox.style.display = 'block';
    }

    // Function to insert prompt into the input box, replacing the / part
    function insertPrompt(inputElement, prompt) {
        let inputValue = inputElement.value;

        // 查找最后一个 / 的位置
        const lastSlashIndex = inputValue.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            // 替换 / 及其后的内容为选中的 prompt
            inputValue = inputValue.substring(0, lastSlashIndex) + prompt;
        } else {
            // 如果没有 /，则直接在末尾插入
            inputValue += prompt;
        }

        // 将修改后的值插入输入框
        inputElement.value = inputValue;

        // 将光标移动到文本末尾
        inputElement.focus(); // 重新设置焦点到输入框
        inputElement.setSelectionRange(inputValue.length, inputValue.length); // 保持光标在行末

        suggestionBox.style.display = 'none';
    }

    // Function to filter prompts based on user input
    function filterPrompts(query) {
        return prompts.filter(prompt => prompt.toLowerCase().includes(query.toLowerCase()));
    }

    // 检查页面是否有textarea元素（输入框）
    function detectChatInput() {
        const inputBox = document.querySelector('textarea'); // ChatGPT输入框

        if (!inputBox) {
            console.log("没有找到输入框，正在等待...");
            return; // 如果没有找到输入框，则返回
        }

        console.log("输入框已找到，开始监听输入...");

        // 初始化选项索引
        let selectedIndex = -1;

        // 监听输入框中的输入事件
        inputBox.addEventListener('input', function(event) {
            const inputValue = event.target.value;

            // 当检测到输入 `/` 时，显示prompt建议框
            if (inputValue.includes('/')) {
                const query = inputValue.split('/').pop().trim();
                const filteredPrompts = filterPrompts(query);
                showSuggestions(inputBox, filteredPrompts);
            } else {
                suggestionBox.style.display = 'none';
            }
        });

        // Handle key navigation for suggestions (Arrow Up/Down, Enter, and ESC)
        inputBox.addEventListener('keydown', (e) => {
            const suggestions = suggestionBox.querySelectorAll('.suggestion');
            if (suggestions.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (selectedIndex < suggestions.length - 1) {
                        selectedIndex++;
                    }
                    updateSelectedSuggestion(suggestions, selectedIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (selectedIndex > 0) {
                        selectedIndex--;
                    }
                    updateSelectedSuggestion(suggestions, selectedIndex);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0) {
                        suggestions[selectedIndex].click();
                    }
                } else if (e.key === 'Escape') {
                    // 按下 ESC 键时关闭提示框
                    suggestionBox.style.display = 'none';
                }
            }
        });
    }

    // Update selected suggestion based on arrow keys
    function updateSelectedSuggestion(suggestions, selectedIndex) {
        suggestions.forEach((suggestion, index) => {
            if (index === selectedIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }

    // 延时执行，以确保页面加载完成
    setTimeout(detectChatInput, 3000);

})();
