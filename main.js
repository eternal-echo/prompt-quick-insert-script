// ==UserScript==
// @name         ChatGPT Prompt Suggestion Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A script to suggest prompts based on user input in the ChatGPT input box
// @author       eternal-echo
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 捕获用户输入模块
    const InputCaptureModule = {
        inputField: null, // 存放输入框元素
        triggerChar: '/', // 触发字符

        init() {
            console.log('InputCaptureModule: Initializing...');
            this.inputField = document.querySelector('textarea'); // 假设ChatGPT使用textarea作为输入框
            if (this.inputField) {
                this.inputField.addEventListener('keyup', this.handleInput.bind(this));
                console.log('InputCaptureModule: Input field found and event listener added.');
            } else {
                console.error('InputCaptureModule: Input field not found.');
            }
        },

        handleInput(event) {
            const inputValue = this.inputField.value;
            console.log(`InputCaptureModule: User typed - ${inputValue}`);

            // 检测是否输入了触发字符
            const triggerIndex = inputValue.lastIndexOf(this.triggerChar);
            if (triggerIndex !== -1) {
                const query = inputValue.slice(triggerIndex + 1); // 获取触发字符后面的内容
                console.log(`InputCaptureModule: Trigger character detected. Query - "${query}"`);
                const results = DataMatchingModule.match(query);
                SuggestionBoxModule.renderSuggestions(results);
            }
        }
    };

    // Prompt 数据管理模块
    const PromptManagerModule = {
        promptsData: [
            { name: "polish", tag: ["text"], prompt: "我希望你能担任英语翻译、拼写校对和修辞改进的角色..." },
            { name: "translate", tag: ["text"], prompt: "我希望你担任翻译家，目标是把任何语言翻译成中文..." },
        ], // 示例数据
    };

    // 建议框渲染模块
    const SuggestionBoxModule = {
        suggestionBox: null, // 用于存储建议框的DOM元素

        init() {
            console.log('SuggestionBoxModule: Initializing...');
            this.suggestionBox = document.createElement('div');
            this.suggestionBox.style.position = 'absolute';
            this.suggestionBox.style.backgroundColor = 'white';
            this.suggestionBox.style.border = '1px solid #ccc';
            this.suggestionBox.style.zIndex = '1000';
            this.suggestionBox.style.maxHeight = '200px';
            this.suggestionBox.style.overflowY = 'auto';
            this.suggestionBox.style.display = 'none'; // 初始隐藏
            document.body.appendChild(this.suggestionBox);
            console.log('SuggestionBoxModule: Suggestion box created and added to the DOM.');
        },

        renderSuggestions(suggestions) {
            if (suggestions.length === 0) {
                this.suggestionBox.style.display = 'none';
                console.log('SuggestionBoxModule: No suggestions to display.');
                return;
            }

            // 清空之前的建议
            this.suggestionBox.innerHTML = '';

            suggestions.forEach((suggestion, index) => {
                const suggestionItem = document.createElement('div');
                suggestionItem.innerText = suggestion.name + ': ' + suggestion.prompt;
                suggestionItem.style.padding = '5px';
                suggestionItem.style.cursor = 'pointer';
                suggestionItem.addEventListener('click', () => {
                    InputCaptureModule.inputField.value = suggestion.prompt;
                    this.suggestionBox.style.display = 'none';
                    console.log(`SuggestionBoxModule: User selected prompt - "${suggestion.prompt}"`);
                    UserInteractionModule.resetSelection(); // 重置选择
                });
                this.suggestionBox.appendChild(suggestionItem);
            });

            // 显示建议框并调整位置
            const inputFieldRect = InputCaptureModule.inputField.getBoundingClientRect();
            this.suggestionBox.style.top = `${window.scrollY + inputFieldRect.top}px`; // 调整位置以对齐
            this.suggestionBox.style.left = `${window.scrollX + inputFieldRect.left}px`;
            this.suggestionBox.style.width = `${inputFieldRect.width}px`;
            this.suggestionBox.style.display = 'block';

            console.log('SuggestionBoxModule: Suggestions rendered.');
        }
    };

    // 用户交互模块
    const UserInteractionModule = {
        selectedIndex: -1, // 当前选中的提示项索引

        init() {
            console.log('UserInteractionModule: Initializing...');
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        },

        handleKeyDown(event) {
            const suggestions = SuggestionBoxModule.suggestionBox.children;

            // 如果建议框不可见或没有内容，忽略键盘事件
            if (SuggestionBoxModule.suggestionBox.style.display === 'none' || suggestions.length === 0) return;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault(); // 防止默认的光标移动
                    this.moveSelection(1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.moveSelection(-1);
                    break;
                case 'Enter':
                    if (this.selectedIndex >= 0 && this.selectedIndex < suggestions.length) {
                        event.preventDefault();
                        suggestions[this.selectedIndex].click();
                    }
                    break;
                case 'Escape':
                    SuggestionBoxModule.suggestionBox.style.display = 'none';
                    this.resetSelection();
                    break;
                default:
                    break;
            }
        },

        moveSelection(step) {
            const suggestions = SuggestionBoxModule.suggestionBox.children;

            if (this.selectedIndex >= 0 && this.selectedIndex < suggestions.length) {
                suggestions[this.selectedIndex].style.backgroundColor = '';
            }

            this.selectedIndex += step;

            if (this.selectedIndex >= suggestions.length) this.selectedIndex = 0;
            if (this.selectedIndex < 0) this.selectedIndex = suggestions.length - 1;

            suggestions[this.selectedIndex].style.backgroundColor = '#d3d3d3';
            console.log(`UserInteractionModule: Highlighted suggestion at index ${this.selectedIndex}`);
        },

        resetSelection() {
            this.selectedIndex = -1;
            console.log('UserInteractionModule: Reset selection');
        }
    };

    // 数据匹配模块
    const DataMatchingModule = {
        match(query) {
            console.log(`DataMatchingModule: Performing match for query "${query}"`);

            // 如果查询为空，则返回所有的 prompts
            if (query.trim() === "") {
                console.log(`DataMatchingModule: Query is empty, returning all prompts.`);
                return PromptManagerModule.promptsData;
            }

            // 简单的模糊匹配逻辑，匹配 `name` 或 `prompt` 字段
            const results = PromptManagerModule.promptsData.filter(item => {
                const queryLower = query.toLowerCase();
                return item.name.toLowerCase().includes(queryLower) || item.prompt.toLowerCase().includes(queryLower);
            });

            console.log(`DataMatchingModule: Found ${results.length} result(s) for query "${query}"`);
            return results;
        }
    };

    // 快捷键与操作逻辑模块
    const ShortcutModule = {
        triggerKey: '/', // 触发字符

        init() {
            console.log('ShortcutModule: Initializing...');
            InputCaptureModule.inputField.addEventListener('keydown', this.handleTriggerKey.bind(this));
        },

        handleTriggerKey(event) {
            if (event.key === this.triggerKey) {
                console.log(`ShortcutModule: Trigger key "${this.triggerKey}" pressed.`);
                InputCaptureModule.handleInput(event); // 手动调用输入捕获
            }
        }
    };

    // 初始化所有模块
    function init() {
        console.log('Script: Initializing all modules...');
        InputCaptureModule.init();
        SuggestionBoxModule.init();
        UserInteractionModule.init();
        ShortcutModule.init();
    }

    // 等待页面加载完成后初始化脚本
    window.addEventListener('load', init);

})();