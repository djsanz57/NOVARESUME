// State Management
const initialState = {
    personal: {
        fullName: 'John Doe',
        jobTitle: 'Senior Software Engineer',
        email: 'john.doe@example.com',
        phone: '+1 (555) 000-0000',
        location: 'San Francisco, CA',
        website: 'www.johndoe.com',
        linkedin: 'linkedin.com/in/johndoe'
    },
    summary: 'Results-driven Software Engineer with 8+ years of experience in building scalable web applications. Expert in React, Node.js, and cloud architecture. Proven track record of improving system performance by 40% and leading cross-functional teams.',
    experience: [
        {
            company: 'TechCorp Solutions',
            position: 'Senior Software Engineer',
            dates: '2020 - Present',
            location: 'San Francisco, CA',
            description: '• Led the migration of monolithic architecture to microservices, reducing deployment time by 50%.\n• Optimized frontend performance resulting in a 30% increase in user engagement.\n• Mentored 10+ junior developers and implemented best practices for code reviews.'
        },
        {
            company: 'Innovation Labs',
            position: 'Software Developer',
            dates: '2017 - 2020',
            location: 'Austin, TX',
            description: '• Developed and maintained 5+ core products using React and Redux.\n• Collaborated with UX designers to implement responsive and accessible user interfaces.\n• Reduced bug reports by 25% through rigorous automated testing.'
        }
    ],
    education: [
        {
            school: 'University of Technology',
            degree: 'B.S. in Computer Science',
            dates: '2013 - 2017',
            location: 'Austin, TX'
        }
    ],
    skills: ['JavaScript (ES6+)', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'GraphQL', 'PostgreSQL'],
    projects: [
        {
            name: 'EcoTrack App',
            description: 'Built a sustainability tracking app using React Native and Firebase. Reached 10k+ downloads in the first 3 months.'
        }
    ],
    achievements: [
        {
            name: 'Employee of the Year',
            description: 'Recognized for outstanding contribution to the core platform stability in 2022.'
        }
    ],
    settings: {
        template: 'minimalist',
        primaryColor: '#2563eb',
        fontSize: 'base',
        fontFamily: 'Inter',
        atsMode: false
    }
};

let resumeState = JSON.parse(localStorage.getItem('novaResumeData')) || initialState;

// DOM Elements
const formContainer = document.getElementById('form-container');
const resumePreview = document.getElementById('resume-preview');
const navItems = document.querySelectorAll('.nav-item');
const colorDots = document.querySelectorAll('.color-dot');
const templateCards = document.querySelectorAll('.template-card');
const templateModal = document.getElementById('template-modal');
const btnTemplates = document.getElementById('btn-templates');
const closeModal = document.querySelector('.close-modal');
const atsToggle = document.getElementById('ats-optimize');
const aiImproveBtn = document.getElementById('btn-ai-improve');
const aiSuggestionText = document.getElementById('ai-suggestion');
const btnUpload = document.getElementById('btn-upload');
const uploadInput = document.getElementById('resume-upload');
const parsingModal = document.getElementById('parsing-modal');
const parsingStatus = document.getElementById('parsing-status');
const btnAiTransform = document.getElementById('btn-ai-transform');

// Sections configuration
const sections = {
    personal: {
        title: 'Personal Details',
        fields: [
            { id: 'fullName', label: 'Full Name', type: 'text' },
            { id: 'jobTitle', label: 'Job Title', type: 'text' },
            { id: 'email', label: 'Email', type: 'email' },
            { id: 'phone', label: 'Phone', type: 'text' },
            { id: 'location', label: 'Location', type: 'text' },
            { id: 'website', label: 'Website (Optional)', type: 'text' },
            { id: 'linkedin', label: 'LinkedIn', type: 'text' }
        ]
    },
    summary: {
        title: 'Professional Summary',
        fields: [
            { id: 'summary', label: 'Professional Summary', type: 'textarea' }
        ]
    },
    experience: { title: 'Work Experience', isList: true },
    education: { title: 'Education', isList: true },
    skills: { title: 'Detailed Skills', isList: true },
    projects: { title: 'Projects', isList: true },
    achievements: { title: 'Achievements', isList: true }
};

// Initialization
function init() {
    renderForm('personal');
    renderPreview();
    setupEventListeners();
}

// Render Form based on section
function renderForm(sectionId) {
    const section = sections[sectionId];
    if (!section) return;

    if (section.isList) {
        renderListForm(sectionId);
        return;
    }

    let html = `<h2>${section.title}</h2>`;
    section.fields.forEach(field => {
        const val = sectionId === 'summary' ? resumeState.summary : resumeState.personal[field.id];
        html += `
            <div class="form-group">
                <label for="${field.id}">${field.label}</label>
                ${field.type === 'textarea'
                ? `<textarea id="${field.id}" rows="6">${val}</textarea>`
                : `<input type="${field.type}" id="${field.id}" value="${val || ''}">`
            }
            </div>
        `;
    });
    formContainer.innerHTML = html;

    // Attach local listeners
    formContainer.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', (e) => {
            if (sectionId === 'summary') {
                resumeState.summary = e.target.value;
                debouncedAI(sectionId, e.target.value);
            } else {
                resumeState.personal[e.target.id] = e.target.value;
            }
            saveAndRefresh();
        });
    });

    // Provide initial context to AI
    updateAIAssistant(sectionId);
}

function renderListForm(sectionId) {
    const title = sections[sectionId].title;
    let html = `<div class="form-section-header">
        <h2>${title}</h2>
        <button class="btn secondary sm" onclick="addListItem('${sectionId}')">+ Add</button>
    </div>`;

    const items = resumeState[sectionId] || [];

    if (sectionId === 'skills') {
        html += `
            <div class="form-group">
                <label>Skills (Comma separated)</label>
                <textarea oninput="updateSkills(this.value)">${resumeState.skills.join(', ')}</textarea>
            </div>
        `;
    } else {
        items.forEach((item, index) => {
            html += `
                <div class="list-item-form" data-index="${index}">
                    <div class="list-item-header">
                        <h3>Item ${index + 1}</h3>
                        <button class="btn-remove" onclick="removeItem('${sectionId}', ${index})">Remove</button>
                    </div>
                    ${Object.keys(item).map(key => `
                        <div class="form-group">
                            <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                            ${key === 'description'
                    ? `<textarea oninput="updateListItem('${sectionId}', ${index}, '${key}', this.value)">${item[key]}</textarea>`
                    : `<input type="text" value="${item[key]}" oninput="updateListItem('${sectionId}', ${index}, '${key}', this.value)">`
                }
                        </div>
                    `).join('')}
                </div>
            `;
        });
    }

    formContainer.innerHTML = html;

    // Provide initial context to AI
    updateAIAssistant(sectionId);
}

window.updateSkills = (val) => {
    resumeState.skills = val.split(',').map(s => s.trim()).filter(s => s !== '');
    saveAndRefresh();
};

// Global functions for list interaction (expose to window for inline onclick)
window.updateListItem = (section, index, key, value) => {
    resumeState[section][index][key] = value;
    if (key === 'description') debouncedAI(section, value);
    saveAndRefresh();
};

window.addListItem = (section) => {
    const newItem = section === 'experience'
        ? { company: '', position: '', dates: '', location: '', description: '' }
        : section === 'education'
            ? { school: '', degree: '', dates: '', location: '' }
            : { name: '', description: '' };

    resumeState[section].push(newItem);
    renderListForm(section);
};

window.removeItem = (section, index) => {
    resumeState[section].splice(index, 1);
    renderListForm(section);
    renderPreview();
};

// Render Preview
function renderPreview() {
    const { personal, summary, experience, education, skills, projects, achievements, settings } = resumeState;

    resumePreview.className = `resume-preview ${settings.template} ${settings.atsMode ? 'ats-mode' : ''}`;
    resumePreview.style.setProperty('--primary', settings.primaryColor);

    let html = '';

    if (settings.template === 'minimalist' || settings.atsMode) {
        html = `
            <header class="preview-header">
                <h1>${personal.fullName}</h1>
                <p class="subtitle">${personal.jobTitle}</p>
                <div class="contact-info">
                    <span>${personal.email}</span> • 
                    <span>${personal.phone}</span> • 
                    <span>${personal.location}</span>
                </div>
            </header>
            
            <section class="p-section">
                <h3>Summary</h3>
                <p>${summary}</p>
            </section>

            <section class="p-section">
                <h3>Experience</h3>
                ${experience.map(exp => `
                    <div class="p-item">
                        <div class="p-item-header">
                            <strong>${exp.position}</strong>
                            <span>${exp.dates}</span>
                        </div>
                        <div class="p-item-sub">${exp.company} | ${exp.location}</div>
                        <div class="p-item-desc">${exp.description.replace(/\n/g, '<br>')}</div>
                    </div>
                `).join('')}
            </section>

            <section class="p-section">
                <h3>Education</h3>
                ${education.map(edu => `
                    <div class="p-item">
                        <div class="p-item-header">
                            <strong>${edu.degree}</strong>
                            <span>${edu.dates}</span>
                        </div>
                        <div class="p-item-sub">${edu.school}</div>
                    </div>
                `).join('')}
            </section>

            <section class="p-section">
                <h3>Skills</h3>
                <div class="skills-grid">
                    ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            </section>

            <section class="p-section">
                <h3>Projects</h3>
                ${projects.map(proj => `
                    <div class="p-item">
                        <div class="p-item-header"><strong>${proj.name}</strong></div>
                        <div class="p-item-desc">${proj.description}</div>
                    </div>
                `).join('')}
            </section>

            <section class="p-section">
                <h3>Achievements</h3>
                <ul style="margin-left: 1.5rem;">
                    ${achievements.map(ach => `<li><strong>${ach.name}</strong>: ${ach.description}</li>`).join('')}
                </ul>
            </section>
        `;
    } else if (settings.template === 'corporate') {
        html = `
            <div style="display: flex; gap: 2rem;">
                <div style="flex: 2;">
                    <h1 style="font-size: 2.5rem; color: var(--primary); margin-bottom: 0.5rem;">${personal.fullName}</h1>
                    <h2 style="font-size: 1.2rem; margin-bottom: 1.5rem;">${personal.jobTitle}</h2>
                    
                    <div class="p-section">
                        <h3 style="background: var(--primary); color: white; padding: 4px 10px;">EXPERIENCE</h3>
                        ${experience.map(exp => `
                            <div class="p-item">
                                <div class="p-item-header"><strong>${exp.position}</strong></div>
                                <div class="p-item-sub" style="color: var(--primary)">${exp.company} • ${exp.dates}</div>
                                <div class="p-item-desc">${exp.description.replace(/\n/g, '<br>')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="flex: 1; border-left: 1px solid var(--border); padding-left: 1.5rem;">
                    <div class="p-section">
                        <h3 style="border-bottom: 2px solid var(--primary)">CONTACT</h3>
                        <p>${personal.email}</p>
                        <p>${personal.phone}</p>
                        <p>${personal.location}</p>
                    </div>
                    <div class="p-section">
                        <h3 style="border-bottom: 2px solid var(--primary)">EDUCATION</h3>
                        ${education.map(edu => `
                            <div class="p-item">
                                <strong>${edu.degree}</strong>
                                <p>${edu.school}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="p-section">
                        <h3 style="border-bottom: 2px solid var(--primary)">SKILLS</h3>
                        <p>${skills.join(', ')}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        html = `<div style="text-align:center; padding: 100px;">Template "${settings.template}" coming soon! Try <strong>Minimalist</strong> or <strong>Corporate</strong>.</div>`;
    }

    resumePreview.innerHTML = html;
}

function saveAndRefresh() {
    localStorage.setItem('novaResumeData', JSON.stringify(resumeState));
    renderPreview();
}

function setupEventListeners() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            renderForm(item.dataset.section);
        });
    });

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            resumeState.settings.primaryColor = dot.dataset.color;
            saveAndRefresh();
        });
    });

    btnTemplates.addEventListener('click', () => templateModal.style.display = 'block');
    closeModal.addEventListener('click', () => templateModal.style.display = 'none');

    templateCards.forEach(card => {
        card.addEventListener('click', () => {
            templateCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            resumeState.settings.template = card.dataset.template;
            saveAndRefresh();
            templateModal.style.display = 'none';
        });
    });

    atsToggle.addEventListener('change', (e) => {
        resumeState.settings.atsMode = e.target.checked;
        saveAndRefresh();
    });

    // Mock Industry Standards and Keyword Replacements
    const industryStandards = {
        personal: "Industry Standard: Ensure your email sounds professional and provide a clean LinkedIn URL (e.g., without the extra letters/numbers at the end).",
        summary: "Industry Standard: Keep it under 4 lines. Focus on your top 2-3 defining achievements. Use action verbs.",
        experience: "Industry Standard: Use the XYZ formula. \n'Accomplished [X] as measured by [Y], by doing [Z].' Always start bullets with action verbs.",
        education: "Industry Standard: If you have >3 years of experience, move education below your work history. You don't need to include your graduation year if it was more than 10-15 years ago.",
        skills: "Industry Standard: Tailor your skills directly to the job description. Prioritize hard skills over soft skills for ATS compatibility.",
        projects: "Industry Standard: Highlight the technologies used and the specific impact or user base of the project.",
        achievements: "Industry Standard: Quantify awards where possible (e.g., '1st place out of 500+ participants')."
    };

    const keywordUpgrades = {
        "led": "spearheaded/orchestrated",
        "managed": "mentored/supervised",
        "worked": "collaborated",
        "did": "executed",
        "made": "engineered/developed",
        "responsible for": "accountable for / directed",
        "helped": "facilitated",
        "fixed": "resolved / optimized"
    };

    window.updateAIAssistant = (sectionId) => {
        aiSuggestionText.innerHTML = `${industryStandards[sectionId] || "Add content to get AI suggestions."}`;
    };

    let aiTimeout;
    window.debouncedAI = (sectionId, text) => {
        clearTimeout(aiTimeout);
        aiTimeout = setTimeout(() => {
            const words = text.toLowerCase();
            let suggestions = [];

            for (const [weakWord, strongWord] of Object.entries(keywordUpgrades)) {
                if (words.includes(weakWord)) {
                    suggestions.push(`Consider replacing <strong>"${weakWord}"</strong> with <strong>"${strongWord}"</strong> for more impact.`);
                }
            }

            if (suggestions.length > 0) {
                aiSuggestionText.innerHTML = `✨ Keyword Tip:<br>` + suggestions.join('<br>');
            } else {
                updateAIAssistant(sectionId);
            }
        }, 800);
    };

    aiImproveBtn.addEventListener('click', () => {
        aiImproveBtn.innerHTML = '<span class="spinner" style="width: 15px; height: 15px; display: inline-block; border-width: 2px;"></span> Analyzing...';
        aiImproveBtn.disabled = true;

        setTimeout(() => {
            const currentSection = document.querySelector('.nav-item.active').dataset.section;
            let result = '';

            if (currentSection === 'summary') {
                result = "Strategic Software Leader with 8+ years experience specializing in cloud-native solutions. Expert in driving 40% efficiency gains through architectural optimization and cross-functional leadership.";
                resumeState.summary = result;
            } else if (currentSection === 'experience') {
                result = "I've restructured your bullet points to start with strong action verbs and highlighted your 50% deployment efficiency gain.";
            } else {
                result = "Everything looks optimized for ATS and industry standards!";
            }

            aiSuggestionText.textContent = `✨ AI Suggestion applied: ${result}`;
            aiImproveBtn.textContent = 'Improve Content';
            aiImproveBtn.disabled = false;
            renderForm(currentSection);
            saveAndRefresh();
        }, 1200);
    });

    document.getElementById('btn-export-pdf').addEventListener('click', () => {
        window.print();
    });

    // Upload Resume Logic
    btnUpload.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadInput.addEventListener('change', (e) => {
        if (!e.target.files.length) return;

        const file = e.target.files[0];
        const exts = ['pdf', 'doc', 'docx', 'txt'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!exts.includes(ext)) {
            alert('Please upload a PDF, DOCX, or TXT file.');
            return;
        }

        simulateParsing(file.name);
    });

    // Holistic AI Transformation
    btnAiTransform.addEventListener('click', () => {
        simulateAITransform();
    });
}

function simulateAITransform() {
    parsingModal.style.display = 'block';

    // Customize modal for transformation instead of parsing
    const title = parsingModal.querySelector('h2');
    const originalTitleText = title.textContent;
    title.textContent = "AI Magic Transform ✨";

    const messages = [
        "Scanning for spelling and grammar errors...",
        "Rewriting phrasing to industry standards...",
        "Applying active verbs and impactful keywords...",
        "Polishing formatting for modern ATS..."
    ];

    let step = 0;
    const interval = setInterval(() => {
        if (step < messages.length) {
            parsingStatus.innerHTML = `<strong>${messages[step]}</strong>`;
            step++;
        } else {
            clearInterval(interval);
            applyAITransform();
            parsingModal.style.display = 'none';
            title.textContent = originalTitleText; // Restore title
        }
    }, 1200);
}

function applyAITransform() {
    // Advanced NLP mockup (Rewriting existing drafted content to high-end standards)
    if (resumeState.summary) {
        resumeState.summary = "A highly adaptive and results-driven professional with proven expertise in orchestrating cross-functional initiatives and optimizing complex systems. Adept at leveraging modern methodologies to drive a 40%+ increase in measurable efficiency. Exceptionally skilled at bridging the gap between technical execution and strategic business objectives.";
    }

    if (resumeState.experience) {
        resumeState.experience = resumeState.experience.map(exp => {
            let desc = exp.description
                .replace(/Managed/gi, "Directed")
                .replace(/Led/gi, "Spearheaded")
                .replace(/Worked with/gi, "Collaborated extensively with")
                .replace(/did/gi, "executed")
                .replace(/made/gi, "engineered")
                .replace(/helped/gi, "facilitated")
                .replace(/great/gi, "exceptional");

            // Mock fixing spelling/grammar errors
            desc = desc.replace(/teh /g, "the ")
                .replace(/recieve/g, "receive")
                .replace(/acheive/g, "achieve")
                .replace(/its'/g, "its");

            return { ...exp, description: desc };
        });
    }

    resumeState.settings.template = "minimalist"; // Assume minimalist is the clean modern ATS standard
    resumeState.settings.primaryColor = "#6366f1"; // Indigo is very trendy in modern UI

    saveAndRefresh();

    // Sync the UI active states for the new settings
    colorDots.forEach(d => {
        d.classList.remove('active');
        if (d.dataset.color === "#6366f1") d.classList.add('active');
    });

    templateCards.forEach(c => {
        c.classList.remove('active');
        if (c.dataset.template === 'minimalist') c.classList.add('active');
    });

    // Re-render form tab
    const activeSection = document.querySelector('.nav-item.active').dataset.section;
    renderForm(activeSection);

    // Allow React/DOM to paint then alert
    setTimeout(() => alert("✨ AI transformation complete! Your resume has been spell-checked, grammatically corrected, and modernized."), 100);
}

function simulateParsing(filename) {
    parsingModal.style.display = 'block';

    const messages = [
        "Analyzing document structure...",
        "Extracting work experience...",
        "Identifying key skills...",
        "Structuring parsed data..."
    ];

    let step = 0;
    const interval = setInterval(() => {
        if (step < messages.length) {
            parsingStatus.textContent = messages[step];
            step++;
        } else {
            clearInterval(interval);
            applyMockParsedData();
            parsingModal.style.display = 'none';
            uploadInput.value = ''; // Reset input
        }
    }, 800);
}

function applyMockParsedData() {
    // This is a mocked output of what an AI parser would return
    resumeState = {
        personal: {
            fullName: 'Jane Smith',
            jobTitle: 'Product Designer',
            email: 'jane.smith@design.io',
            phone: '(555) 987-6543',
            location: 'New York, NY',
            website: 'janesmithdesign.com',
            linkedin: 'linkedin.com/in/janesmith'
        },
        summary: 'Award-winning Product Designer with over 6 years of experience creating user-centric digital products. Specializes in UX research, Wireframing, and leading design sprints. Proven history of improving user retention by 25% through intuitive interface designs.',
        experience: [
            {
                company: 'Creative Tech Inc.',
                position: 'Senior UX Designer',
                dates: '2021 - Present',
                location: 'New York, NY',
                description: '• Redesigned the core SaaS platform, reducing onboarding time by 30%.\n• Managed a team of 4 junior designers and established a unified design system.\n• Conducted A/B testing on pricing pages leading to a 15% conversion increase.'
            },
            {
                company: 'StartUp Hub',
                position: 'UI/UX Designer',
                dates: '2018 - 2021',
                location: 'Boston, MA',
                description: '• Created interactive prototypes for 12+ client applications using Figma.\n• Collaborated closely with front-end engineers to ensure design fidelity during development.'
            }
        ],
        education: [
            {
                school: 'Rhode Island School of Design',
                degree: 'BFA in Interactive Design',
                dates: '2014 - 2018',
                location: 'Providence, RI'
            }
        ],
        skills: ['Figma', 'Sketch', 'User Research', 'Prototyping', 'Design Systems', 'HTML/CSS', 'Agile'],
        projects: [
            {
                name: 'FinTech App Redesign',
                description: 'Led the UI overhaul of a mobile banking app, resulting in a 4.8-star App Store rating.'
            }
        ],
        achievements: [
            {
                name: 'Design Excellence Award 2022',
                description: 'Won best mobile interface for the FinTech App Redesign project.'
            }
        ],
        settings: resumeState.settings // Preserve settings
    };

    saveAndRefresh();
    // Render the currently active form tab again
    const activeSection = document.querySelector('.nav-item.active').dataset.section;
    renderForm(activeSection);
}

// Zoom functionality
let zoom = 100;
document.getElementById('zoom-in').onclick = () => {
    zoom += 10;
    updateZoom();
};
document.getElementById('zoom-out').onclick = () => {
    zoom -= 10;
    updateZoom();
};
function updateZoom() {
    resumePreview.style.transform = `scale(${zoom / 100})`;
    document.getElementById('zoom-level').textContent = `${zoom}%`;
}

// Boot
init();
