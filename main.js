// ==UserScript==
// @name         ChatGPT Prompt Insert with JSON Management
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Insert prompt with dropdown suggestion in ChatGPT input box, managed with JSON, and name field matching
// @author       Grimoire
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Prompt 列表，以 JSON 管理
    const prompts = [
        {
            "name": "polish",
            "tag" : ["text"],
            "prompt": "我希望你能担任英语翻译、拼写校对和修辞改进的角色。..."
        },
        {
            "name": "translate",
            "tag" : ["text"],
            "prompt": "下面我让你来充当翻译家，你的目标是把任何语言翻译成中文..."
        },
        {
            "name": "Chinese",
            "tag" : ["text", "instruction"],
            "prompt": "\nPlease respond to the following text in Chinese. \n"
        },
        {
            "name": "think",
            "tag" : ["instruction"],
            "prompt": "\nTake a deep breath. \nLet's think step by step. \n"
        },
        {
            "name": "逐步分解解释",
            "tag" : ["instruction"],
            "prompt": "\n用逐步分解的方式进行解释。\n"
        },
        {
            "name": "案例研究解释",
            "tag" : ["instruction"],
            "prompt": "\n使用案例研究进行解释。\n"
        },
        {
            "name": "代码修改",
            "tag" : ["instruction"],
            "prompt": "\n请你仅给出修改的代码片段，并说明修改的原因。\n"
        },
    ];

    // 添加 CSS 样式，用于提示框
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

    // 函数：展示匹配的建议项，并高亮匹配部分
    function showSuggestions(inputElement, suggestions, query) {
        suggestionBox.innerHTML = '';
        if (suggestions.length === 0) {
            suggestionBox.style.display = 'none';
            return;
        }

        suggestions.forEach((suggestion) => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.classList.add('suggestion');

            // 高亮 name、tag、prompt 中匹配的部分
            const highlightText = (text) => {
                const regex = new RegExp(`(${query})`, 'gi'); // 匹配输入部分
                return text.replace(regex, `<span style="background-color: yellow;">$1</span>`); // 高亮显示
            };

            // 构建高亮后的展示内容
            const highlightedName = highlightText(suggestion.name);
            const highlightedTags = suggestion.tag.map(tag => highlightText(tag)).join(", ");
            const highlightedPrompt = highlightText(suggestion.prompt);

            // 显示格式为：name - tags - prompt (仅部分)
            suggestionDiv.innerHTML = `
                <strong>${highlightedName}</strong> - [${highlightedTags}]<br>
                ${highlightedPrompt.substring(0, 50)}...`; // 只显示部分 prompt

            // 绑定点击事件
            suggestionDiv.addEventListener('click', () => {
                insertPrompt(inputElement, suggestion.prompt);
            });

            suggestionBox.appendChild(suggestionDiv);
        });

        // 定位提示框到输入框的下方
        const rect = inputElement.getBoundingClientRect();
        suggestionBox.style.bottom = `${window.innerHeight - (rect.top + window.scrollY)}px`; // 底部显示
        suggestionBox.style.left = `${rect.left + window.scrollX}px`;
        suggestionBox.style.width = `${rect.width}px`; // 和输入框同宽
        suggestionBox.style.display = 'block';
    }


    // 将选中的 prompt 插入到输入框中，替换 / 之后的内容
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

    // 根据用户输入匹配 name、tag 和 prompt 字段
    function filterPrompts(query) {
        const lowerCaseQuery = query.toLowerCase();

        return prompts.filter(prompt => {
            // 在 name、tag 和 prompt 中查找匹配项
            const nameMatch = prompt.name.toLowerCase().includes(lowerCaseQuery);
            const tagMatch = prompt.tag.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
            const promptMatch = prompt.prompt.toLowerCase().includes(lowerCaseQuery);
            
            return nameMatch || tagMatch || promptMatch;
        });
    }


    // 监听输入框
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
        inputBox.addEventListener('input', function (event) {
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

        // 处理上下键、Enter 和 ESC 键
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
                // } else if (e.key === 'Enter') {
                //     e.preventDefault();
                //     if (selectedIndex >= 0) {
                //         suggestions[selectedIndex].click();
                //     }
                } else if (e.key === 'Escape') {
                    // 按下 ESC 键时关闭提示框
                    suggestionBox.style.display = 'none';
                }
            }
        });
    }

    // 更新选中的建议项
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
