// 대본 작성기 - 메인 JavaScript 파일

class ScreenplayWriter {
    constructor() {
        this.currentProject = {
            title: '',
            author: '',
            date: '',
            characters: [],
            scenes: [],
            currentSceneIndex: 0
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromLocalStorage();
        this.setCurrentDate();
    }

    // 이벤트 바인딩
    bindEvents() {
        // 헤더 버튼들
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadProject());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportProject());

        // 사이드바 버튼들
        document.getElementById('addCharacterBtn').addEventListener('click', () => this.addCharacter());
        document.getElementById('addSceneBtn').addEventListener('click', () => this.addScene());

        // 툴바 버튼들
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setLineType(e.target.dataset.type));
        });

        // 입력 필드 이벤트
        document.getElementById('scriptTitle').addEventListener('input', (e) => {
            this.currentProject.title = e.target.value;
            this.autoSave();
        });

        document.getElementById('author').addEventListener('input', (e) => {
            this.currentProject.author = e.target.value;
            this.autoSave();
        });

        document.getElementById('date').addEventListener('input', (e) => {
            this.currentProject.date = e.target.value;
            this.autoSave();
        });

        // 대본 내용 변경 감지
        document.getElementById('scriptContent').addEventListener('input', () => {
            this.saveCurrentScene();
            this.autoSave();
        });

        // 엔터 키 처리
        document.getElementById('scriptContent').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleEnterKey(e);
            }
        });
    }

    // 현재 날짜 설정
    setCurrentDate() {
        const today = new Date();
        const dateString = today.toLocaleDateString('ko-KR');
        document.getElementById('date').value = dateString;
        this.currentProject.date = dateString;
    }

    // 등장인물 추가
    addCharacter() {
        const name = prompt('등장인물 이름을 입력하세요:');
        if (name && name.trim()) {
            const character = {
                id: Date.now(),
                name: name.trim(),
                description: ''
            };
            this.currentProject.characters.push(character);
            this.renderCharacters();
            this.autoSave();
        }
    }

    // 등장인물 목록 렌더링
    renderCharacters() {
        const container = document.getElementById('charactersList');
        container.innerHTML = '';

        this.currentProject.characters.forEach(character => {
            const div = document.createElement('div');
            div.className = 'character-item';
            div.innerHTML = `
                <strong>${character.name}</strong>
                <button class="delete-btn" onclick="screenplayWriter.deleteCharacter(${character.id})" 
                        style="float: right; background: none; border: none; color: #dc3545; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        });
    }

    // 등장인물 삭제
    deleteCharacter(id) {
        if (confirm('이 등장인물을 삭제하시겠습니까?')) {
            this.currentProject.characters = this.currentProject.characters.filter(c => c.id !== id);
            this.renderCharacters();
            this.autoSave();
        }
    }

    // 장면 추가
    addScene() {
        const title = prompt('장면 제목을 입력하세요 (예: INT. 카페 - 낮):');
        if (title && title.trim()) {
            const scene = {
                id: Date.now(),
                title: title.trim(),
                content: '<div class="script-line"><span class="line-type">지문</span><span class="line-content">새로운 장면이 시작됩니다.</span></div>'
            };
            this.currentProject.scenes.push(scene);
            this.renderScenes();
            this.switchToScene(this.currentProject.scenes.length - 1);
            this.autoSave();
        }
    }

    // 장면 목록 렌더링
    renderScenes() {
        const container = document.getElementById('scenesList');
        container.innerHTML = '';

        this.currentProject.scenes.forEach((scene, index) => {
            const div = document.createElement('div');
            div.className = `scene-item ${index === this.currentProject.currentSceneIndex ? 'active' : ''}`;
            div.innerHTML = `
                <div onclick="screenplayWriter.switchToScene(${index})" style="cursor: pointer; padding: 0.5rem;">
                    <strong>장면 ${index + 1}</strong><br>
                    <small>${scene.title}</small>
                </div>
                <button class="delete-btn" onclick="screenplayWriter.deleteScene(${index})" 
                        style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: #dc3545; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            `;
            div.style.position = 'relative';
            container.appendChild(div);
        });
    }

    // 장면 전환
    switchToScene(index) {
        if (index >= 0 && index < this.currentProject.scenes.length) {
            this.saveCurrentScene(); // 현재 장면 저장
            this.currentProject.currentSceneIndex = index;
            this.loadCurrentScene(); // 새 장면 로드
            this.renderScenes(); // UI 업데이트
        }
    }

    // 장면 삭제
    deleteScene(index) {
        if (confirm('이 장면을 삭제하시겠습니까?')) {
            this.currentProject.scenes.splice(index, 1);
            if (this.currentProject.currentSceneIndex >= this.currentProject.scenes.length) {
                this.currentProject.currentSceneIndex = Math.max(0, this.currentProject.scenes.length - 1);
            }
            this.renderScenes();
            this.loadCurrentScene();
            this.autoSave();
        }
    }

    // 현재 장면 저장
    saveCurrentScene() {
        const sceneIndex = this.currentProject.currentSceneIndex;
        if (this.currentProject.scenes[sceneIndex]) {
            const title = document.getElementById('currentSceneTitle').value;
            const content = document.getElementById('scriptContent').innerHTML;
            
            this.currentProject.scenes[sceneIndex].title = title;
            this.currentProject.scenes[sceneIndex].content = content;
        }
    }

    // 현재 장면 로드
    loadCurrentScene() {
        const scene = this.currentProject.scenes[this.currentProject.currentSceneIndex];
        if (scene) {
            document.getElementById('currentSceneTitle').value = scene.title;
            document.getElementById('scriptContent').innerHTML = scene.content;
        } else {
            // 기본 장면이 없으면 생성
            if (this.currentProject.scenes.length === 0) {
                this.addDefaultScene();
            }
        }
    }

    // 기본 장면 추가
    addDefaultScene() {
        const scene = {
            id: Date.now(),
            title: 'INT. 장소 - 시간',
            content: '<div class="script-line"><span class="line-type">지문</span><span class="line-content">대본을 작성하세요...</span></div>'
        };
        this.currentProject.scenes.push(scene);
        this.renderScenes();
        this.loadCurrentScene();
    }

    // 라인 타입 설정
    setLineType(type) {
        // 툴바 버튼 활성화 표시
        document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // 새 라인 추가
        this.addNewLine(type);
    }

    // 새 라인 추가
    addNewLine(type) {
        const typeNames = {
            'action': '지문',
            'dialogue': '대사',
            'parenthetical': '지시문',
            'character': '등장인물'
        };

        const scriptContent = document.getElementById('scriptContent');
        const newLine = document.createElement('div');
        newLine.className = 'script-line';
        newLine.innerHTML = `
            <span class="line-type">${typeNames[type]}</span>
            <span class="line-content" contenteditable="true"></span>
        `;
        
        scriptContent.appendChild(newLine);
        
        // 새로 추가된 라인에 포커스
        const contentSpan = newLine.querySelector('.line-content');
        contentSpan.focus();
    }

    // 엔터 키 처리
    handleEnterKey(e) {
        e.preventDefault();
        this.addNewLine('action'); // 기본적으로 지문 타입으로 새 라인 추가
    }

    // 프로젝트 저장
    saveProject() {
        this.saveCurrentScene();
        const projectData = JSON.stringify(this.currentProject);
        localStorage.setItem('screenplayProject', projectData);
        
        // 파일 다운로드 옵션도 제공
        const blob = new Blob([projectData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentProject.title || '대본'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert('프로젝트가 저장되었습니다!');
    }

    // 프로젝트 불러오기
    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        this.currentProject = JSON.parse(e.target.result);
                        this.renderProject();
                        alert('프로젝트가 불러와졌습니다!');
                    } catch (error) {
                        alert('파일을 읽는 중 오류가 발생했습니다.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // 로컬 스토리지에서 불러오기
    loadFromLocalStorage() {
        const saved = localStorage.getItem('screenplayProject');
        if (saved) {
            try {
                this.currentProject = JSON.parse(saved);
                this.renderProject();
            } catch (error) {
                console.error('저장된 프로젝트를 불러오는 중 오류 발생:', error);
            }
        }
    }

    // 프로젝트 전체 렌더링
    renderProject() {
        // 기본 정보 설정
        document.getElementById('scriptTitle').value = this.currentProject.title || '';
        document.getElementById('author').value = this.currentProject.author || '';
        document.getElementById('date').value = this.currentProject.date || '';
        
        // 등장인물과 장면 렌더링
        this.renderCharacters();
        this.renderScenes();
        this.loadCurrentScene();
    }

    // 자동 저장
    autoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            const projectData = JSON.stringify(this.currentProject);
            localStorage.setItem('screenplayProject', projectData);
        }, 1000);
    }

    // 프로젝트 내보내기 (HTML 형식)
    exportProject() {
        this.saveCurrentScene();
        
        let html = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>${this.currentProject.title}</title>
            <style>
                body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .title-page { text-align: center; margin-bottom: 50px; }
                .scene-title { font-weight: bold; margin: 20px 0; }
                .script-line { margin: 10px 0; }
                .line-type { font-weight: bold; margin-right: 20px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="title-page">
                <h1>${this.currentProject.title}</h1>
                <p>작가: ${this.currentProject.author}</p>
                <p>날짜: ${this.currentProject.date}</p>
            </div>
        `;

        this.currentProject.scenes.forEach((scene, index) => {
            html += `<div class="scene-title">장면 ${index + 1}: ${scene.title}</div>`;
            html += `<div class="scene-content">${scene.content}</div>`;
        });

        html += `
        </body>
        </html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentProject.title || '대본'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// 앱 초기화
const screenplayWriter = new ScreenplayWriter();