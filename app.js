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
    certifications: [],
    languages: [],
    interests: [],
    volunteer: [],
    settings: {
        template: 'minimalist',
        primaryColor: '#2563eb',
        fontSize: 'base',
        fontFamily: 'Inter',
        atsMode: false
    }
};

let resumeState = JSON.parse(localStorage.getItem('novaResumeData')) || initialState;
if (!resumeState.certifications) resumeState.certifications = [];
if (!resumeState.languages) resumeState.languages = [];
if (!resumeState.interests) resumeState.interests = [];
if (!resumeState.volunteer) resumeState.volunteer = [];

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
    achievements: { title: 'Achievements', isList: true },
    certifications: { title: 'Certifications', isList: true },
    languages: { title: 'Languages', isList: true },
    interests: { title: 'Interests', isList: true },
    volunteer: { title: 'Volunteer Experience', isList: true }
};

// Initialization
function init() {
    navItems[0].classList.add('active'); // Ensure at least one tab is active
    setupEventListeners();
    renderForm('personal');
    renderPreview();
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
            let itemTitle = `Item ${index + 1}`;
            if (sectionId === 'experience') itemTitle = `${item.company || 'Experience'} ${item.dates ? `(${item.dates})` : ''}`;
            else if (sectionId === 'education') itemTitle = `${item.school || 'Education'} ${item.dates ? `(${item.dates})` : ''}`;
            else if (sectionId === 'certifications') itemTitle = item.name || 'Certification';
            else if (sectionId === 'languages') itemTitle = item.language || 'Language';
            else if (sectionId === 'projects' || sectionId === 'achievements') itemTitle = item.name || `Item ${index + 1}`;
            else if (sectionId === 'volunteer') itemTitle = item.role || item.organization || 'Volunteer';

            html += `
                <div class="list-item-form" data-index="${index}">
                    <div class="list-item-header">
                        <h3>${itemTitle}</h3>
                        <button class="btn-remove" onclick="removeItem('${sectionId}', ${index})">Remove</button>
                    </div>
                    ${Object.keys(item).map(key => {
                const safeValue = String(item[key]).replace(/"/g, '&quot;');
                return `
                        <div class="form-group">
                            <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                            ${key === 'description'
                        ? `<textarea oninput="updateListItem('${sectionId}', ${index}, '${key}', this.value)">${item[key]}</textarea>`
                        : `<input type="text" value="${safeValue}" oninput="updateListItem('${sectionId}', ${index}, '${key}', this.value)">`
                    }
                        </div>
                    `}).join('')}
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
    let newItem;
    if (section === 'experience') newItem = { company: '', position: '', dates: '', location: '', description: '' };
    else if (section === 'education') newItem = { school: '', degree: '', dates: '', location: '' };
    else if (section === 'certifications') newItem = { name: '', issuer: '', dates: '' };
    else if (section === 'languages') newItem = { language: '', proficiency: '' };
    else if (section === 'interests') newItem = { interest: '' };
    else if (section === 'volunteer') newItem = { organization: '', role: '', dates: '', description: '' };
    else newItem = { name: '', description: '' };

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
    const { personal, summary, experience, education, skills, projects, achievements, certifications, languages, interests, volunteer, settings } = resumeState;

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
            
            ${certifications && certifications.length > 0 ? `
            <section class="p-section">
                <h3>Certifications</h3>
                ${certifications.map(cert => `
                    <div class="p-item" style="margin-bottom: 0.5rem;">
                        <div class="p-item-header">
                            <strong>${cert.name}</strong>
                            <span>${cert.dates}</span>
                        </div>
                        <div class="p-item-sub">${cert.issuer}</div>
                    </div>
                `).join('')}
            </section>` : ''}

            ${volunteer && volunteer.length > 0 ? `
            <section class="p-section">
                <h3>Volunteer Experience</h3>
                ${volunteer.map(vol => `
                    <div class="p-item">
                        <div class="p-item-header">
                            <strong>${vol.role}</strong>
                            <span>${vol.dates}</span>
                        </div>
                        <div class="p-item-sub">${vol.organization}</div>
                        <div class="p-item-desc">${vol.description}</div>
                    </div>
                `).join('')}
            </section>` : ''}

            ${languages && languages.length > 0 ? `
            <section class="p-section">
                <h3>Languages</h3>
                <div class="skills-grid">
                    ${languages.map(l => `<span class="skill-tag">${l.language} (${l.proficiency})</span>`).join('')}
                </div>
            </section>` : ''}

            ${interests && interests.length > 0 ? `
            <section class="p-section">
                <h3>Interests</h3>
                <div class="skills-grid">
                    ${interests.map(i => `<span class="skill-tag">${i.interest}</span>`).join('')}
                </div>
            </section>` : ''}

            <div class="cv-signature" style="margin-top: 3rem; text-align: right; padding-right: 2rem; position: relative;">
                <div style="font-family: 'Caveat', cursive; font-size: 2.8rem; color: var(--text-muted); opacity: 0.8; transform: rotate(-3deg); margin-bottom: -10px; display: inline-block;">${personal.fullName}</div>
                <div style="border-top: 1px solid var(--border); padding-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); width: 220px; float: right; text-align: center; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Digital Signature</div>
                <div style="clear: both;"></div>
            </div>
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
                    
                    ${volunteer && volunteer.length > 0 ? `
                    <div class="p-section" style="margin-top: 2rem;">
                        <h3 style="background: var(--primary); color: white; padding: 4px 10px;">VOLUNTEER</h3>
                        ${volunteer.map(vol => `
                            <div class="p-item">
                                <div class="p-item-header"><strong>${vol.role}</strong></div>
                                <div class="p-item-sub" style="color: var(--primary)">${vol.organization} • ${vol.dates}</div>
                                <div class="p-item-desc">${vol.description.replace(/\n/g, '<br>')}</div>
                            </div>
                        `).join('')}
                    </div>` : ''}
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

                    ${languages && languages.length > 0 ? `
                    <div class="p-section">
                        <h3 style="border-bottom: 2px solid var(--primary)">LANGUAGES</h3>
                        ${languages.map(l => `<p><strong>${l.language}</strong>: ${l.proficiency}</p>`).join('')}
                    </div>` : ''}

                    ${certifications && certifications.length > 0 ? `
                    <div class="p-section">
                        <h3 style="border-bottom: 2px solid var(--primary)">CERTIFICATIONS</h3>
                        ${certifications.map(c => `
                            <div style="margin-bottom: 0.5rem;">
                                <strong>${c.name}</strong><br>
                                <span style="font-size: 0.85em; color: var(--text-muted)">${c.issuer} • ${c.dates}</span>
                            </div>
                        `).join('')}
                    </div>` : ''}

                    ${interests && interests.length > 0 ? `
                    <div class="p-section">
                        <h3 style="border-bottom: 2px solid var(--primary)">INTERESTS</h3>
                        <p>${interests.map(i => i.interest).join(', ')}</p>
                    </div>` : ''}
                </div>
            </div>

            <div class="cv-signature" style="margin-top: 3rem; text-align: right; padding-right: 1rem;">
                <div style="font-family: 'Caveat', cursive; font-size: 2.8rem; color: var(--primary); opacity: 0.9; transform: rotate(-3deg); margin-bottom: -10px; display: inline-block;">${personal.fullName}</div>
                <div style="border-top: 1px solid var(--border); padding-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); width: 220px; float: right; text-align: center; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Digital Signature</div>
                <div style="clear: both;"></div>
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
            const currentSection = document.querySelector('.nav-item.active')?.dataset?.section;
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

            if (currentSection) {
                renderForm(currentSection);
            }
            saveAndRefresh();
        }, 1200);
    });

    document.getElementById('btn-export-pdf').addEventListener('click', () => {
        window.print();
    });

    // Upload Resume Logic
    const btnUpload = document.getElementById('btn-upload');
    if (btnUpload) {
        btnUpload.addEventListener('click', () => {
            uploadInput.click();
        });
    }

    uploadInput.addEventListener('change', async (e) => {
        if (!e.target.files.length) return;

        const file = e.target.files[0];
        const exts = ['pdf', 'doc', 'docx', 'txt'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!exts.includes(ext)) {
            alert('Please upload a PDF, DOCX, or TXT file.');
            return;
        }

        parsingModal.style.display = 'block';
        parsingStatus.textContent = "Reading file contents...";

        try {
            let extractedText = "";
            if (ext === 'pdf') {
                extractedText = await extractTextFromPDF(file);
            } else if (ext === 'docx') {
                extractedText = await extractTextFromDOCX(file);
            } else {
                extractedText = await extractTextFromTXT(file);
            }
            simulateParsing(extractedText);
        } catch (error) {
            console.error(error);
            parsingStatus.textContent = "Error reading file format.";
            setTimeout(() => {
                parsingModal.style.display = 'none';
                uploadInput.value = '';
            }, 2000);
        }
    });

    // Holistic AI Transformation
    btnAiTransform.addEventListener('click', () => {
        simulateAITransform();
    });

    const btnUpgradeCv = document.getElementById('btn-upgrade-cv');
    if (btnUpgradeCv) {
        btnUpgradeCv.addEventListener('click', () => {
            simulateAITransform();
        });
    }
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
    const fixGrammarAndVocab = (text) => {
        if (!text) return text;
        let fixed = text
            // Vocabulary Upgrades
            .replace(/\bManaged\b/gi, "Directed")
            .replace(/\bLed\b/gi, "Spearheaded")
            .replace(/\bWorked with\b/gi, "Collaborated extensively with")
            .replace(/\bdid\b/gi, "executed")
            .replace(/\bmade\b/gi, "engineered")
            .replace(/\bhelped\b/gi, "facilitated")
            .replace(/\bgreat\b/gi, "exceptional")
            // Grammar/Spelling Fixes
            .replace(/\bteh\b/gi, "the")
            .replace(/\brecieve\b/gi, "receive")
            .replace(/\bacheive\b/gi, "achieve")
            .replace(/\bits\'\b/g, "its");
        return fixed;
    };

    if (resumeState.summary && resumeState.summary.length < 50) {
        // Fallback if summary was blank or mostly empty
        resumeState.summary = "A highly adaptive and results-driven professional with proven expertise in orchestrating cross-functional initiatives and optimizing complex systems. Adept at leveraging modern methodologies to drive a 40%+ increase in measurable efficiency. Exceptionally skilled at bridging the gap between technical execution and strategic business objectives.";
    } else if (resumeState.summary) {
        resumeState.summary = fixGrammarAndVocab(resumeState.summary);
        // Prepend AI polish
        if (!resumeState.summary.includes('Results-driven')) {
            resumeState.summary = "Results-driven professional: " + resumeState.summary;
        }
    }

    if (resumeState.experience) {
        resumeState.experience = resumeState.experience.map(exp => {
            return { ...exp, description: fixGrammarAndVocab(exp.description) };
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

    // Re-render form tab if possible
    const activeSectionEl = document.querySelector('.nav-item.active');
    if (activeSectionEl) {
        renderForm(activeSectionEl.dataset.section);
    }

    // Allow React/DOM to paint then alert
    setTimeout(() => alert("✨ AI transformation complete! Your resume has been spell-checked, grammatically corrected, and modernized."), 100);
}

function simulateParsing(extractedText) {
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
            applyRealParsedData(extractedText);
            parsingModal.style.display = 'none';
            uploadInput.value = ''; // Reset input
        }
    }, 400); // Super fast 400ms interval for < 2 second parsing
}

function applyRealParsedData(rawText) {
    if (!rawText) rawText = "No readable text found in document.";

    // Basic heuristics
    const emailMatch = rawText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const phoneMatch = rawText.match(/(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);

    // Parse Sections
    const sectionKeywords = {
        experience: ['experience', 'work experience', 'employment', 'professional experience', 'history'],
        education: ['education', 'academic background'],
        skills: ['skills', 'technical skills', 'core competencies', 'expertise'],
        projects: ['projects', 'personal projects', 'academic projects'],
        achievements: ['achievements', 'awards', 'certifications', 'honors'],
        summary: ['summary', 'profile', 'objective', 'about me']
    };

    let currentSection = 'header';
    const parsedSections = {
        header: '', summary: '', experience: '', education: '', skills: '', projects: '', achievements: ''
    };

    const lines = rawText.split('\n');
    for (let line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        const lowerLine = cleanLine.toLowerCase().replace(/[^a-z\s]/g, '');
        let matchedSection = null;

        for (const [key, keywords] of Object.entries(sectionKeywords)) {
            if (keywords.some(k => lowerLine === k || lowerLine === k + 's' || lowerLine.startsWith(k + ' '))) {
                matchedSection = key;
                break;
            }
        }

        if (matchedSection) {
            currentSection = matchedSection;
        } else {
            parsedSections[currentSection] += line + '\n';
        }
    }

    // Guess name (First line of header usually)
    let firstLine = parsedSections.header.trim().split(/\n/)[0] || rawText.trim().split(/\n/)[0] || '';
    if (firstLine.length > 50) firstLine = "Scanned User"; // Fallback
    if (firstLine.trim().length === 0) firstLine = "Scanned User";

    // Update state fields with real scanned data
    resumeState.personal.fullName = firstLine.trim();
    if (emailMatch) resumeState.personal.email = emailMatch[0];
    if (phoneMatch) resumeState.personal.phone = phoneMatch[0].trim();

    // Map extracted sections directly into State
    if (parsedSections.summary.trim()) {
        resumeState.summary = parsedSections.summary.trim();
    }

    if (parsedSections.experience.trim()) {
        const rawExpBlocks = parsedSections.experience.trim().split(/\n\s*\n/);
        let expBlocks = [];

        // Track standard date ranges or mm/yyyy formats
        const dateTrackerRegex = /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4}|\d{1,2}\/\d{4})\s*[-–to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4}|\d{1,2}\/\d{4}|Present|Current|Now)\b/i;

        rawExpBlocks.forEach(block => {
            const lines = block.split('\n').filter(l => l.trim().length > 0);
            let currentChunk = [];
            let inDescription = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const isBullet = /^[•\-\*><▪]/.test(line);
                if (isBullet) inDescription = true;

                const hasDate = dateTrackerRegex.test(line);
                const nextHasDate = i + 1 < lines.length && dateTrackerRegex.test(lines[i + 1]);

                // We split if we were previously in a description block, but the current line is NOT a bullet,
                // and it's relatively short or contains a date (indicating a new header).
                const isNewJobTrigger = inDescription && !isBullet && (hasDate || line.length < 50 || nextHasDate);

                // Or if it's just a massive block without bullets, but we hit a strong date trigger
                const isFallbackTrigger = currentChunk.length > 2 && (hasDate || (nextHasDate && line.length < 60));

                if (currentChunk.length > 0 && (isNewJobTrigger || (!inDescription && isFallbackTrigger))) {
                    expBlocks.push(currentChunk.join('\n'));
                    currentChunk = [];
                    inDescription = false;
                }
                currentChunk.push(line);
            }
            if (currentChunk.length > 0) expBlocks.push(currentChunk.join('\n'));
        });

        resumeState.experience = expBlocks.map((block, i) => {
            const blockLines = block.trim().split('\n').filter(l => l.trim().length > 0);

            // Determine where the description actually starts by finding the first bullet point
            let descStartIndex = 2; // Default
            for (let j = 0; j < Math.min(blockLines.length, 4); j++) {
                if (/^[•\-\*><▪]/.test(blockLines[j].trim())) {
                    descStartIndex = j;
                    break;
                }
            }

            let company = descStartIndex > 0 ? blockLines[0] : `Experience ${i + 1}`;
            let position = descStartIndex > 1 ? blockLines[1] : '';
            if (descStartIndex > 2 && blockLines[2]) position += ' ' + blockLines[2]; // Sometimes date is on line 3

            let location = '';

            // Try to extract location (e.g. City, ST or City, State)
            const locRegex = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,})\b/;
            let m1 = company.match(locRegex);
            if (m1) { location = m1[1]; company = company.replace(locRegex, '').replace(/[-|,|–]\s*$/, ''); }
            else if (position) {
                let m2 = position.match(locRegex);
                if (m2) { location = m2[1]; position = position.replace(locRegex, '').replace(/[-|,|–]\s*$/, ''); }
            }

            // More robust date regex identifying full ranges or single years
            const fallbackDateRegex = /\b(?:20\d{2}|19\d{2})\b/;
            let dates = block.match(dateTrackerRegex)?.[0] || block.match(fallbackDateRegex)?.[0] || '';

            // Clean matched dates out of titles
            if (dates) {
                company = company.replace(dates, '').replace(/[-|,|–]\s*$/, '').trim();
                position = position.replace(dates, '').replace(/[-|,|–]\s*$/, '').trim();
            }

            // Clean up any stray bullet fragments from the titles
            company = company.replace(/^[•\-\*><▪]\s*/, '').trim();
            position = position.replace(/^[•\-\*><▪]\s*/, '').trim();

            const descLines = blockLines.slice(descStartIndex);
            let description = descLines.join('\n');
            if (dates) description = description.replace(dates, ''); // ensure date isn't in desc

            // Auto-format description with bullets if they are missing
            if (!/^[•\-\*><▪]/m.test(description) && description.length > 30) {
                // Split by periods followed by a space (sentence boundaries), append bullet
                description = "• " + description.split(/(?<=[a-zA-Z]{3}\.)\s+/).join('\n• ');
                description = description.replace(/•\s*$/, '').trim();
            }

            return {
                company: company.substring(0, 100).trim() || 'Experience',
                position: position.substring(0, 100).trim(),
                dates: dates.substring(0, 50).trim(),
                location: location.substring(0, 50).trim(),
                description: description.trim()
            };
        });

        // Automatically sort extracted experience by descending year (recent jobs first)
        resumeState.experience.sort((a, b) => {
            const getYear = dateStr => {
                if (/present|current|now/i.test(dateStr)) return 9999;
                const match = dateStr.match(/\d{4}/g);
                return match ? Math.max(...match.map(Number)) : 0;
            };
            return getYear(b.dates) - getYear(a.dates);
        });
    } else {
        // Fallback dump
        resumeState.experience = [{
            company: 'Parsed from Document',
            position: 'Raw Text Review',
            dates: 'Review Below',
            location: '',
            description: rawText.substring(0, 1500)
        }];
    }

    if (parsedSections.education.trim()) {
        const eduBlocks = parsedSections.education.trim().split(/\n\s*\n/);
        resumeState.education = eduBlocks.map((block, i) => {
            const blockLines = block.trim().split('\n').filter(l => l.trim().length > 0);
            let school = blockLines[0] || `Institution ${i + 1}`;
            let degree = blockLines.length > 1 ? blockLines[1] : '';

            // Robust date logic
            const dateRegex = /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4})\s*[-–to]+[\s\w]*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4}|Present|Current)\b/i;
            const fallbackDateRegex = /\b(?:20\d{2}|19\d{2})\b/;
            let dates = block.match(dateRegex)?.[0] || block.match(fallbackDateRegex)?.[0] || '';

            let location = '';
            const locRegex = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2,})\b/;
            let m = school.match(locRegex);
            if (m) { location = m[1]; school = school.replace(locRegex, '').replace(/[-|,|–]\s*$/, ''); }

            if (dates) {
                school = school.replace(dates, '').replace(/[-|,|–]\s*$/, '');
                degree = degree.replace(dates, '').replace(/[-|,|–]\s*$/, '');
            }

            return {
                school: school.substring(0, 100).trim(),
                degree: degree.substring(0, 100).trim(),
                dates: dates.substring(0, 50).trim(),
                location: location.substring(0, 50).trim()
            };
        });
    }

    // Skills (Fallback to keyword matcher if parsed section is empty)
    if (parsedSections.skills.trim()) {
        const words = parsedSections.skills.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 1);
        resumeState.skills = [...new Set([...words])].slice(0, 20); // Limit to top 20
    } else {
        const commonSkills = ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'Management', 'Sales', 'Design', 'Figma', 'AWS', 'Docker', 'Marketing', 'Excel', 'C++', 'Agile'];
        let foundSkills = [];
        const lowerRawText = rawText.toLowerCase();
        commonSkills.forEach(s => {
            if (lowerRawText.includes(s.toLowerCase())) {
                foundSkills.push(s);
            }
        });
        if (foundSkills.length > 0) resumeState.skills = [...new Set([...resumeState.skills, ...foundSkills])];
    }

    saveAndRefresh();
    // Render the currently active form tab again safely
    const activeSectionEl = document.querySelector('.nav-item.active');
    if (activeSectionEl) {
        renderForm(activeSectionEl.dataset.section);
    }

    // Trigger AI modernization dynamically if the user has the switch enabled
    if (document.getElementById('auto-modernize') && document.getElementById('auto-modernize').checked) {
        setTimeout(() => simulateAITransform(), 600);
    }
}

// Extraction Utilities
async function extractTextFromTXT(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

async function extractTextFromDOCX(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            mammoth.extractRawText({ arrayBuffer: event.target.result })
                .then(function (result) {
                    resolve(result.value);
                })
                .catch(reject);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function () {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();

                    let lastY;
                    let pageText = "";
                    for (let item of textContent.items) {
                        // PDF.js transform array: [scaleX, skewY, skewX, scaleY, translateX, translateY]
                        const currentY = item.transform[5];
                        const gap = lastY !== undefined ? Math.abs(currentY - lastY) : 0;

                        if (lastY === undefined || gap < 5) {
                            pageText += item.str + " ";
                        } else if (gap > 14) {
                            pageText += "\n\n" + item.str + " "; // Paragraph break heuristic
                        } else {
                            pageText += "\n" + item.str + " ";
                        }
                        lastY = currentY;
                    }
                    fullText += pageText + "\n";
                }
                resolve(fullText);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
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
