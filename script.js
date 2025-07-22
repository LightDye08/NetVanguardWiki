// Section icons mapping
const sectionIcons = {
    'overview': 'fa-home',
    'architecture': 'fa-sitemap',
    'features': 'fa-cogs',
    'ui-ux': 'fa-paint-brush',
    'progress': 'fa-tasks',
    'security': 'fa-shield-alt',
    'deployment': 'fa-cloud-upload-alt',
    'future': 'fa-road',
    'advanced-features': 'fa-star',
    'roadmap': 'fa-map',
    'api-docs': 'fa-code'
};

// Plan-restricted sections
const professionalSectionIds = ['advanced-features', 'api-docs'];
const premiumSectionIds = ['roadmap'];

// Section titles
const sectionTitles = {
    'overview': 'Resumen',
    'architecture': 'Arquitectura',
    'features': 'Funcionalidades',
    'ui-ux': 'UI/UX',
    'progress': 'Progreso',
    'security': 'Seguridad',
    'deployment': 'Despliegue',
    'future': 'Futuro',
    'advanced-features': 'Características Avanzadas',
    'roadmap': 'Roadmap Detallado',
    'api-docs': 'Documentación API'
};

// Section ID mapping (fix keys to match markdown parsing)
const sectionIdMap = {
    'overview': 'resumen-del-proyecto-netvanguard',
    'architecture': 'arquitectura',
    'features': 'funcionalidades',
    'ui-ux': 'ui-ux', // <-- fix from 'ui/ux'
    'progress': 'progreso',
    'security': 'seguridad',
    'deployment': 'despliegue',
    'future': 'futuro',
    'advanced-features': 'advanced-features',
    'roadmap': 'roadmap',
    'api-docs': 'api-docs'
};

// Global variables
let sectionsMap = {};
let currentSectionKey = 'overview';

// Configure Markdown parser
marked.setOptions({
    gfm: true,
    breaks: true,
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    }
});

// Load content from markdown file
async function loadContent() {
    try {
        const response = await fetch('content.md');
        if (!response.ok) throw new Error('Error loading content.md');
        const content = await response.text();
        sectionsMap = parseMarkdownIntoSections(content);
        showSection(currentSectionKey);
        setupNavigation(); // <-- ensure navigation is initialized after content loads
    } catch (error) {
        console.error('Error loading content:', error);
        document.getElementById('wiki-sections').innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading content</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Parse markdown into sections
function parseMarkdownIntoSections(markdownContent) {
    // Split by level 2 headers (##)
    const sections = markdownContent.split(/\n## /);
    const sectionsMap = {};
    
    // First section is special (no ## prefix)
    const firstSection = sections.shift();
    if (firstSection.trim()) {
        const firstSectionLines = firstSection.split('\n');
        const firstSectionTitle = firstSectionLines[0].trim();
        const sectionId = firstSectionTitle.toLowerCase().replace(/\s+/g, '-');
        firstSectionLines.shift();
        const sectionContent = firstSectionLines.join('\n');
        
        sectionsMap[sectionId] = {
            title: firstSectionTitle,
            content: marked.parse(sectionContent)
        };
    }

    // Process remaining sections
    sections.forEach(section => {
        if (!section.trim()) return;

        const sectionLines = section.split('\n');
        const sectionTitle = sectionLines[0].trim();
        const sectionId = sectionTitle.toLowerCase().replace(/\s+/g, '-');

        sectionLines.shift();
        const sectionContent = sectionLines.join('\n');

        sectionsMap[sectionId] = {
            title: sectionTitle,
            content: marked.parse(sectionContent)
        };
    });

    return sectionsMap;
}

// Show the selected section
function showSection(sectionKey) {
    currentSectionKey = sectionKey;
    const plan = document.body.getAttribute('data-plan') || 'professional';
    
    // Handle premium sections
    if (professionalSectionIds.includes(sectionKey) && plan !== 'professional' && plan !== 'premium') {
        showRestrictedContent(sectionKey, 'Profesional');
        return;
    }
    
    if (premiumSectionIds.includes(sectionKey) && plan !== 'premium') {
        showRestrictedContent(sectionKey, 'Premium');
        return;
    }
    
    const realSectionId = sectionIdMap[sectionKey];
    const sectionData = sectionsMap[realSectionId];
    
    if (!sectionData) {
        // Handle sections without markdown content
        const title = sectionTitles[sectionKey] || sectionKey;
        const html = `
            <div class="wiki-section" id="${sectionKey}-section">
                <div class="section-header">
                    <i class="fas ${sectionIcons[sectionKey] || 'fa-file-alt'}"></i>
                    <h2>${title}</h2>
                </div>
                <div class="section-content">
                    <p>Contenido no disponible.</p>
                </div>
            </div>
        `;
        document.getElementById('wiki-sections').innerHTML = html;
        return;
    }

    const html = `
        <div class="wiki-section" id="${sectionKey}-section">
            <div class="section-header">
                <i class="fas ${sectionIcons[sectionKey] || 'fa-file-alt'}"></i>
                <h2>${sectionData.title}</h2>
            </div>
            <div class="section-content">
                ${sectionData.content}
            </div>
        </div>
    `;
    document.getElementById('wiki-sections').innerHTML = html;
    
    // Highlight code blocks
    setTimeout(() => {
        document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
        
        // Add Mermaid rendering if needed
        if (typeof mermaid !== 'undefined') {
            mermaid.init(undefined, '.language-mermaid');
        }
    }, 0);
}

// Show restricted content message
function showRestrictedContent(sectionKey, requiredPlan) {
    const title = sectionTitles[sectionKey] || sectionKey;
    const html = `
        <div class="wiki-section restricted-section" id="${sectionKey}-section">
            <div class="section-header">
                <i class="fas ${sectionIcons[sectionKey] || 'fa-file-alt'}"></i>
                <h2>${title}</h2>
            </div>
            <div class="plan-restricted">
                <i class="fas fa-lock"></i>
                <h3>Contenido Premium</h3>
                <p>Esta sección requiere un plan ${requiredPlan}. Actualiza tu plan para acceder a este contenido exclusivo.</p>
                <button class="upgrade-btn" onclick="document.getElementById('change-plan-btn').click()">
                    <i class="fas fa-crown"></i> Actualizar Plan
                </button>
            </div>
        </div>
    `;
    document.getElementById('wiki-sections').innerHTML = html;
}

// Setup navigation functionality
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            const sectionKey = target.substring(1);
            
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            showSection(sectionKey);
        });
    });
}

// Initialize event listeners
function initEventListeners() {
    document.getElementById('change-plan-btn').addEventListener('click', function() {
        document.getElementById('plan-modal').style.display = 'block';
    });

    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('plan-modal').style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('plan-modal')) {
            document.getElementById('plan-modal').style.display = 'none';
        }
    });

    document.querySelectorAll('.select-plan-btn').forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.getAttribute('data-plan');
            document.body.setAttribute('data-plan', plan);
            document.querySelector('.plan-badge span').innerHTML = 
                `Plan: <strong>${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong>`;
            document.getElementById('plan-modal').style.display = 'none';
            
            // Re-render current section with new plan
            showSection(currentSectionKey);
        });
    });

    // Initialize first section
    document.querySelector('.nav-btn.active').click();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadContent();
});