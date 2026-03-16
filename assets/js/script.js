// DOM Elements
const canvas = document.getElementById('outputCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const inputMarginLine = document.getElementById('inputMarginLine');
const fontSelect = document.getElementById('fontSelect');
const fontSizeInput = document.getElementById('fontSize');
const inkColorInput = document.getElementById('inkColor');
const paperTypeSelect = document.getElementById('paperType');
const downloadBtn = document.getElementById('downloadBtn');
const resetLayoutBtn = document.getElementById('resetLayoutBtn');
const generateBtn = document.getElementById('generateBtn');

// Sidebar elements
const paperGrid = document.getElementById('paperGrid');
const fontGrid = document.getElementById('fontGrid');
const fontSizeDown = document.getElementById('fontSizeDown');
const fontSizeUp = document.getElementById('fontSizeUp');

// Floating toolbar
const floatingToolbar = document.getElementById('floatingToolbar');
const floatingMove = document.getElementById('floatingMove');
const floatingColor = document.getElementById('floatingColor');
const floatingReset = document.getElementById('floatingReset');

// State
let paragraphsState = [];
let selectedParaIndex = -1;
let isCanvasGenerated = false;

// Paper configuration
const PAPER_PADDING_LEFT = 80;
const PAPER_PADDING_RIGHT = 30;
const PAPER_PADDING_TOP = 80;

// ==========================================
// Sidebar: Paper & Font Selection
// ==========================================

// Paper thumbnail clicks
paperGrid.addEventListener('click', (e) => {
    const thumb = e.target.closest('.paper-thumb');
    if (!thumb) return;
    paperGrid.querySelectorAll('.paper-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    paperTypeSelect.value = thumb.dataset.paper;
    syncInputPageStyles();
    if (isCanvasGenerated) { syncTextState(); renderCanvas(); }
});

// Font thumbnail clicks
fontGrid.addEventListener('click', (e) => {
    const thumb = e.target.closest('.font-thumb');
    if (!thumb) return;
    fontGrid.querySelectorAll('.font-thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    fontSelect.value = thumb.dataset.font;
    syncInputPageStyles();
    if (isCanvasGenerated) { syncTextState(); renderCanvas(); }
});

// Font size +/- buttons
fontSizeDown.addEventListener('click', () => {
    const current = parseInt(fontSizeInput.value) || 28;
    fontSizeInput.value = Math.max(16, current - 2);
    syncInputPageStyles();
    if (isCanvasGenerated) { syncTextState(); renderCanvas(); }
});
fontSizeUp.addEventListener('click', () => {
    const current = parseInt(fontSizeInput.value) || 28;
    fontSizeInput.value = Math.min(64, current + 2);
    syncInputPageStyles();
    if (isCanvasGenerated) { syncTextState(); renderCanvas(); }
});
fontSizeInput.addEventListener('input', () => {
    syncInputPageStyles();
    if (isCanvasGenerated) { syncTextState(); renderCanvas(); }
});

// ==========================================
// Canvas Drawing Functions
// ==========================================

function drawBlankCanvas() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d1d5db";
    ctx.font = '22px "Inter", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Click 'Convert to Handwriting'", canvas.width / 2, canvas.height / 2 - 14);
    ctx.fillText("to generate your note", canvas.width / 2, canvas.height / 2 + 14);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
}

function drawPaperBackground(lineSpacing) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const paperVal = paperTypeSelect.value;

    if (paperVal === 'ruled') {
        ctx.strokeStyle = "rgba(0, 150, 255, 0.2)";
        ctx.lineWidth = 1;
        for (let y = PAPER_PADDING_TOP; y < canvas.height; y += lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PAPER_PADDING_LEFT - 10, 0);
        ctx.lineTo(PAPER_PADDING_LEFT - 10, canvas.height);
        ctx.stroke();
    } else if (paperVal === 'grid') {
        const gridSize = lineSpacing;
        ctx.strokeStyle = "rgba(0, 150, 255, 0.12)";
        ctx.lineWidth = 0.5;
        for (let y = PAPER_PADDING_TOP; y < canvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        for (let x = PAPER_PADDING_LEFT; x < canvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
    }
}

function processAndDrawParagraphs(maxWidth, lineSpacing, fontSize) {
    let currentBaseY = PAPER_PADDING_TOP - (fontSize * 0.2);
    const startX = PAPER_PADDING_LEFT + 10;

    paragraphsState.forEach((para, index) => {
        if (!para.text || para.text.length === 0) {
            currentBaseY += lineSpacing;
            para.boundingBox = null;
            return;
        }

        const words = para.text.split(' ');
        let currentLine = '';
        let lines = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        const paraStartX = startX + para.offsetX;
        const paraStartY = currentBaseY + para.offsetY;
        const height = lines.length * lineSpacing;

        ctx.fillStyle = para.color || inkColorInput.value;
        lines.forEach((line, i) => {
            ctx.fillText(line, paraStartX, paraStartY + (i * lineSpacing));
        });

        para.boundingBox = {
            x: startX - 10,
            y: paraStartY - fontSize,
            w: maxWidth + 20,
            h: height + (fontSize * 0.2)
        };

        if (index === selectedParaIndex) {
            ctx.save();
            ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
            ctx.fillRect(para.boundingBox.x, para.boundingBox.y, para.boundingBox.w, para.boundingBox.h);
            ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
            ctx.setLineDash([]);
            ctx.lineWidth = 2;
            ctx.strokeRect(para.boundingBox.x, para.boundingBox.y, para.boundingBox.w, para.boundingBox.h);
            ctx.restore();
        }

        currentBaseY += height;
    });
}

// ==========================================
// Input Page Styling (WYSIWYG)
// ==========================================

function syncInputPageStyles() {
    const fontSize = parseInt(fontSizeInput.value) || 28;
    const fontFamily = `"${fontSelect.value}", cursive`;
    const paperVal = paperTypeSelect.value;

    // Fixed line spacing for ruled/grid lines (independent of font size)
    const FIXED_LINE_SPACING = 36;

    textInput.style.fontSize = `${fontSize}px`;
    textInput.style.fontFamily = fontFamily;
    textInput.style.lineHeight = `${FIXED_LINE_SPACING}px`;
    textInput.style.color = inkColorInput.value;

    // Remove all paper classes
    textInput.classList.remove('paper-ruled', 'paper-grid');

    if (paperVal === 'ruled') {
        textInput.classList.add('paper-ruled');
        textInput.style.backgroundSize = `100% ${FIXED_LINE_SPACING}px`;
        textInput.style.backgroundPosition = `0 ${PAPER_PADDING_TOP}px`;
        inputMarginLine.style.display = 'block';
    } else if (paperVal === 'grid') {
        textInput.classList.add('paper-grid');
        textInput.style.backgroundSize = `${FIXED_LINE_SPACING}px ${FIXED_LINE_SPACING}px`;
        textInput.style.backgroundPosition = `${PAPER_PADDING_LEFT}px ${PAPER_PADDING_TOP}px`;
        inputMarginLine.style.display = 'none';
    } else {
        textInput.style.backgroundImage = 'none';
        inputMarginLine.style.display = 'none';
    }
}

// ==========================================
// Render & Generate
// ==========================================

function renderCanvas() {
    if (!isCanvasGenerated) return;

    const fontSize = parseInt(fontSizeInput.value) || 28;
    const lineSpacing = fontSize * 1.4;
    const fontFamily = `"${fontSelect.value}", cursive`;

    drawPaperBackground(lineSpacing);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = inkColorInput.value;
    ctx.textBaseline = "alphabetic";

    const maxTextWidth = canvas.width - PAPER_PADDING_LEFT - PAPER_PADDING_RIGHT;
    processAndDrawParagraphs(maxTextWidth, lineSpacing, fontSize);
    positionFloatingToolbar();
}

function syncTextState() {
    let textContent = textInput.innerText || '';
    if (textContent.endsWith('\n\n')) textContent = textContent.slice(0, -1);

    const lines = textContent.split('\n');
    paragraphsState = lines.map((text, index) => {
        if (paragraphsState[index]) return { ...paragraphsState[index], text };
        return { text, offsetX: 0, offsetY: 0, boundingBox: null, color: inkColorInput.value };
    });

    if (selectedParaIndex >= paragraphsState.length) {
        selectedParaIndex = -1;
        updateSelectionUI();
    }
}

function generateCanvas() {
    isCanvasGenerated = true;
    downloadBtn.disabled = false;
    downloadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    resetLayoutBtn.classList.remove('hidden');
    syncTextState();
    renderCanvas();
}

// ==========================================
// Event Listeners
// ==========================================

inkColorInput.addEventListener('input', () => {
    syncInputPageStyles();
    paragraphsState.forEach(para => { para.color = inkColorInput.value; });
    if (selectedParaIndex !== -1 && paragraphsState[selectedParaIndex]) {
        floatingColor.value = inkColorInput.value;
    }
    if (isCanvasGenerated) renderCanvas();
});

generateBtn.addEventListener('click', generateCanvas);

textInput.addEventListener('input', () => {
    if (isCanvasGenerated) { syncTextState(); renderCanvas(); }
});
textInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && isCanvasGenerated) { syncTextState(); renderCanvas(); }
});

floatingColor.addEventListener('input', (e) => {
    if (selectedParaIndex !== -1 && paragraphsState[selectedParaIndex]) {
        paragraphsState[selectedParaIndex].color = e.target.value;
        if (isCanvasGenerated) renderCanvas();
    }
});

floatingReset.addEventListener('click', () => {
    if (selectedParaIndex !== -1 && paragraphsState[selectedParaIndex]) {
        paragraphsState[selectedParaIndex].offsetX = 0;
        paragraphsState[selectedParaIndex].offsetY = 0;
        if (isCanvasGenerated) renderCanvas();
    }
});

resetLayoutBtn.addEventListener('click', () => {
    paragraphsState.forEach(para => { para.offsetX = 0; para.offsetY = 0; });
    if (isCanvasGenerated) renderCanvas();
});

downloadBtn.addEventListener('click', () => {
    if (!isCanvasGenerated) return;
    const link = document.createElement('a');
    link.download = `handwritten-note-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// ==========================================
// Drag and Drop on Canvas
// ==========================================
let isDragging = false;
let activeParaIndex = -1;
let dragStartX = 0, dragStartY = 0;
let initialOffsetX = 0, initialOffsetY = 0;

function positionFloatingToolbar() {
    if (selectedParaIndex === -1 || !paragraphsState[selectedParaIndex]) {
        floatingToolbar.classList.add('hidden'); return;
    }
    const box = paragraphsState[selectedParaIndex].boundingBox;
    if (!box) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const screenX = rect.left + window.scrollX + (box.x * scaleX);
    const screenY = rect.top + window.scrollY + (box.y * scaleY);
    const boxScreenWidth = box.w * scaleX;
    const toolbarLeft = screenX + (boxScreenWidth / 2) - (floatingToolbar.offsetWidth / 2);
    let toolbarTop = screenY - 55;
    if (box.y * scaleY < 50) toolbarTop = screenY + (box.h * scaleY) + 15;
    floatingToolbar.style.left = `${toolbarLeft}px`;
    floatingToolbar.style.top = `${toolbarTop}px`;
}

function updateSelectionUI() {
    if (selectedParaIndex !== -1 && paragraphsState[selectedParaIndex]) {
        floatingToolbar.classList.remove('hidden');
        floatingColor.value = paragraphsState[selectedParaIndex].color || inkColorInput.value;
        positionFloatingToolbar();
    } else {
        floatingToolbar.classList.add('hidden');
    }
    if (isCanvasGenerated) renderCanvas();
}

window.addEventListener('resize', positionFloatingToolbar);
window.addEventListener('scroll', positionFloatingToolbar);

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

function handleCanvasPointerDown(e) {
    if (!isCanvasGenerated) return;
    const pos = getCanvasCoordinates(e);
    let clickedParaIndex = -1;
    for (let i = paragraphsState.length - 1; i >= 0; i--) {
        const box = paragraphsState[i].boundingBox;
        if (box && pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h) {
            clickedParaIndex = i; break;
        }
    }
    if (selectedParaIndex !== clickedParaIndex) { 
        selectedParaIndex = clickedParaIndex; 
        updateSelectionUI(); 
    }
}

floatingMove.addEventListener('mousedown', (e) => {
    if (selectedParaIndex !== -1 && isCanvasGenerated) {
        e.preventDefault();
        isDragging = true;
        activeParaIndex = selectedParaIndex;
        document.body.style.cursor = 'grabbing';
        dragStartX = e.clientX; 
        dragStartY = e.clientY;
        initialOffsetX = paragraphsState[activeParaIndex].offsetX;
        initialOffsetY = paragraphsState[activeParaIndex].offsetY;
    }
});

floatingMove.addEventListener('touchstart', (e) => {
    if (selectedParaIndex !== -1 && isCanvasGenerated) {
        e.preventDefault();
        isDragging = true;
        activeParaIndex = selectedParaIndex;
        dragStartX = e.touches[0].clientX; 
        dragStartY = e.touches[0].clientY;
        initialOffsetX = paragraphsState[activeParaIndex].offsetX;
        initialOffsetY = paragraphsState[activeParaIndex].offsetY;
    }
}, { passive: false });

function drag(e) {
    if (!isDragging || activeParaIndex === -1) return;
    if (e.type === 'touchmove') e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    paragraphsState[activeParaIndex].offsetX = initialOffsetX + (dx * scaleX);
    paragraphsState[activeParaIndex].offsetY = initialOffsetY + (dy * scaleY);
    renderCanvas();
}

function stopDrag() { 
    isDragging = false; 
    activeParaIndex = -1; 
    document.body.style.cursor = 'default'; 
}

canvas.addEventListener('mousedown', handleCanvasPointerDown);
canvas.addEventListener('mousemove', (e) => {
    if (!isDragging && isCanvasGenerated) {
        const pos = getCanvasCoordinates(e);
        let hovered = false;
        for (let i = paragraphsState.length - 1; i >= 0; i--) {
            const box = paragraphsState[i].boundingBox;
            if (box && pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h) { hovered = true; break; }
        }
        canvas.style.cursor = hovered ? 'pointer' : 'default';
    }
});
window.addEventListener('mousemove', (e) => { if (isDragging) drag(e); }, { passive: false });
window.addEventListener('mouseup', stopDrag);
canvas.addEventListener('touchstart', handleCanvasPointerDown, { passive: false });
window.addEventListener('touchmove', (e) => { if (isDragging) drag(e); }, { passive: false });
window.addEventListener('touchend', stopDrag);

// Paste plain text only
textInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
});

// Init
document.fonts.ready.then(() => { syncInputPageStyles(); });
syncInputPageStyles();
drawBlankCanvas();
