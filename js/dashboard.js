document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadSidebar();
    initDashboardProjectModal();
    loadProjectDashboard();
});

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeText(value) {
    return String(value || '').trim();
}

function projectRiskCount(project) {
    const directCount = project?.riskCount ?? project?.risksCount ?? project?.stats?.riskCount ?? project?.stats?.risks;
    if (typeof directCount === 'number') {
        return directCount;
    }

    if (Array.isArray(project?.risks)) {
        return project.risks.length;
    }

    return 0;
}

function hasEmbeddedRiskCount(project) {
    return Object.prototype.hasOwnProperty.call(project || {}, 'riskCount')
        || Object.prototype.hasOwnProperty.call(project || {}, 'risksCount')
        || Object.prototype.hasOwnProperty.call(project?.stats || {}, 'riskCount')
        || Object.prototype.hasOwnProperty.call(project?.stats || {}, 'risks')
        || Array.isArray(project?.risks);
}

async function hydrateProjectRiskCounts(projects) {
    const safeProjects = Array.isArray(projects) ? projects : [];

    return Promise.all(safeProjects.map(async (project) => {
        let count = projectRiskCount(project);
        const projectId = project?._id || project?.id;

        if (!hasEmbeddedRiskCount(project) && projectId) {
            try {
                const risks = await fetchAPI(`/projects/${projectId}/risks`);
                count = Array.isArray(risks) ? risks.length : 0;
            } catch (err) {
                count = 0;
            }
        }

        return {
            ...project,
            _computedRiskCount: count
        };
    }));
}

function projectTitle(project) {
    return project?.title || project?.name || 'Untitled Project';
}

function setDashboardMessage(message, type) {
    const messageEl = document.getElementById('modalProjectMessage');
    if (!messageEl) return;
    if (!message) {
        messageEl.className = 'status-message';
        messageEl.textContent = '';
        return;
    }
    messageEl.className = `status-message ${type}`;
    messageEl.textContent = message;
}

function setEditProjectMessage(message, type) {
    const messageEl = document.getElementById('editProjectMessage');
    if (!messageEl) return;
    if (!message) {
        messageEl.className = 'status-message';
        messageEl.textContent = '';
        return;
    }
    messageEl.className = `status-message ${type}`;
    messageEl.textContent = message;
}

function initDashboardProjectModal() {
    const modal = document.getElementById('createProjectModal');
    const backdrop = document.getElementById('createProjectBackdrop');
    const openBtn = document.getElementById('openCreateProjectModalBtn');
    const closeBtn = document.getElementById('closeCreateProjectModalBtn');
    const cancelBtn = document.getElementById('modalProjectCancelBtn');
    const form = document.getElementById('dashboardCreateProjectForm');
    const saveBtn = document.getElementById('modalProjectSaveBtn');

    if (!modal || !backdrop || !openBtn || !form) return;

    const openModal = () => {
        setDashboardMessage('', '');
        form.reset();
        modal.hidden = false;
        backdrop.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
    };

    const closeModal = () => {
        modal.hidden = true;
        backdrop.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
    };

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = sanitizeText(document.getElementById('modalProjectTitle').value);
        const description = sanitizeText(document.getElementById('modalProjectDescription').value);
        const startDate = document.getElementById('modalProjectStartDate').value;
        const endDate = document.getElementById('modalProjectEndDate').value;

        if (!title || !startDate || !endDate) {
            setDashboardMessage('Title, start date, and end date are required.', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setDashboardMessage('Start date cannot be after end date.', 'error');
            return;
        }

        const previousText = saveBtn.textContent;
        saveBtn.textContent = 'Creating...';
        saveBtn.disabled = true;

        try {
            await fetchAPI('/projects', {
                method: 'POST',
                body: JSON.stringify({ title, description, startDate, endDate })
            });
            setDashboardMessage('Project created successfully.', 'success');
            await loadProjectDashboard();
            closeModal();
        } catch (err) {
            setDashboardMessage(err.message || 'Failed to create project.', 'error');
        } finally {
            saveBtn.textContent = previousText;
            saveBtn.disabled = false;
        }
    });
}

function initDashboardProjectActions() {
    const projectsList = document.getElementById('projects-list');
    const editModal = document.getElementById('editProjectModal');
    const editBackdrop = document.getElementById('editProjectBackdrop');
    const editCloseBtn = document.getElementById('closeEditProjectModalBtn');
    const editCancelBtn = document.getElementById('editProjectCancelBtn');
    const editForm = document.getElementById('dashboardEditProjectForm');
    const editSaveBtn = document.getElementById('editProjectSaveBtn');

    if (!projectsList || !editModal || !editBackdrop || !editForm) return;

    const openEditModal = (project) => {
        document.getElementById('editProjectId').value = project.id;
        document.getElementById('editProjectTitle').value = project.title;
        document.getElementById('editProjectDescription').value = project.description;
        document.getElementById('editProjectStartDate').value = project.startDate;
        document.getElementById('editProjectEndDate').value = project.endDate;
        setEditProjectMessage('', '');

        editModal.hidden = false;
        editBackdrop.hidden = false;
        editModal.setAttribute('aria-hidden', 'false');
    };

    const closeEditModal = () => {
        editModal.hidden = true;
        editBackdrop.hidden = true;
        editModal.setAttribute('aria-hidden', 'true');
    };

    projectsList.addEventListener('click', async (event) => {
        const editBtn = event.target.closest('[data-action="edit-project"]');
        const deleteBtn = event.target.closest('[data-action="delete-project"]');

        if (editBtn) {
            const projectId = editBtn.getAttribute('data-project-id');
            const projectTitle = editBtn.getAttribute('data-project-title') || '';
            const projectDescription = editBtn.getAttribute('data-project-description') || '';
            const projectStartDate = editBtn.getAttribute('data-project-start-date') || '';
            const projectEndDate = editBtn.getAttribute('data-project-end-date') || '';

            openEditModal({
                id: projectId,
                title: projectTitle,
                description: projectDescription,
                startDate: projectStartDate,
                endDate: projectEndDate
            });
            return;
        }

        if (deleteBtn) {
            const projectId = deleteBtn.getAttribute('data-project-id');
            const projectTitle = deleteBtn.getAttribute('data-project-title') || 'this project';

            if (!confirm(`Delete ${projectTitle}? This action cannot be undone.`)) {
                return;
            }

            const previousText = deleteBtn.textContent;
            deleteBtn.textContent = 'Deleting...';
            deleteBtn.disabled = true;

            try {
                await fetchAPI(`/projects/${projectId}`, { method: 'DELETE' });
                await loadProjectDashboard();
            } catch (err) {
                alert(err.message || 'Failed to delete project.');
            } finally {
                deleteBtn.textContent = previousText;
                deleteBtn.disabled = false;
            }
        }
    });

    editCloseBtn.addEventListener('click', closeEditModal);
    editCancelBtn.addEventListener('click', closeEditModal);
    editBackdrop.addEventListener('click', closeEditModal);

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const projectId = document.getElementById('editProjectId').value;
        const title = sanitizeText(document.getElementById('editProjectTitle').value);
        const description = sanitizeText(document.getElementById('editProjectDescription').value);
        const startDate = document.getElementById('editProjectStartDate').value;
        const endDate = document.getElementById('editProjectEndDate').value;

        if (!title || !startDate || !endDate) {
            setEditProjectMessage('Title, start date, and end date are required.', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setEditProjectMessage('Start date cannot be after end date.', 'error');
            return;
        }

        const previousText = editSaveBtn.textContent;
        editSaveBtn.textContent = 'Saving...';
        editSaveBtn.disabled = true;

        try {
            await fetchAPI(`/projects/${projectId}`, {
                method: 'PUT',
                body: JSON.stringify({ title, description, startDate, endDate })
            });
            closeEditModal();
            await loadProjectDashboard();
        } catch (err) {
            setEditProjectMessage(err.message || 'Failed to update project.', 'error');
        } finally {
            editSaveBtn.textContent = previousText;
            editSaveBtn.disabled = false;
        }
    });
}

async function loadProjectDashboard() {
    const loader = document.getElementById('loader');
    const statsGrid = document.getElementById('stats-grid');
    const projectsList = document.getElementById('projects-list');
    
    loader.style.display = 'block';

    try {
        const projectsRaw = await fetchAPI('/projects');
        const projects = await hydrateProjectRiskCounts(projectsRaw.data || []);
        const totalProjects = Array.isArray(projects) ? projects.length : 0;
        const totalRisks = Array.isArray(projects)
            ? projects.reduce((sum, project) => sum + (project._computedRiskCount || 0), 0)
            : 0;

        document.getElementById('statProjects').textContent = totalProjects;
        document.getElementById('statRisks').textContent = totalRisks;
        statsGrid.style.display = 'grid';

        if (totalProjects === 0) {
            projectsList.innerHTML = `
                <div class="empty-state">
                    <h3>No projects yet</h3>
                    <p>Create your first project before adding any risks.</p>
                    <button type="button" class="btn btn-primary" id="emptyStateCreateProjectBtn" style="width:auto;">Create Project</button>
                </div>
            `;
            const emptyStateCreateBtn = document.getElementById('emptyStateCreateProjectBtn');
            if (emptyStateCreateBtn) {
                emptyStateCreateBtn.addEventListener('click', () => {
                    const openBtn = document.getElementById('openCreateProjectModalBtn');
                    if (openBtn) openBtn.click();
                });
            }
        } else {
            projectsList.innerHTML = projects.map(project => {
                const riskCount = project._computedRiskCount || 0;
                const projectId = encodeURIComponent(project?._id || project?.id || '');
                const rawProjectId = escapeHTML(String(project?._id || project?.id || ''));
                const title = projectTitle(project);
                const description = project.description || '';
                const startDate = project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '';
                const endDate = project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '';
                return `
                    <div class="card project-card">
                        <div class="project-card__header">
                            <div class="project-card__meta">
                                <h3 style="margin:0 0 8px 0;"><a href="project-detail.html?id=${projectId}">${escapeHTML(title)}</a></h3>
                                <p style="margin:0; color:var(--text-muted);">${escapeHTML(project.description || 'No description provided.')}</p>
                            </div>
                            <span class="badge badge-medium">${riskCount} risk${riskCount === 1 ? '' : 's'}</span>
                        </div>
                        <div class="project-card__footer">
                            <span style="color:var(--text-muted); font-size:14px;">Created ${escapeHTML(project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'recently')}</span>
                            <div class="card-inline-actions" style="margin-top:0; gap:8px;">
                                <a href="project-detail.html?id=${projectId}" class="btn btn-primary" style="width:auto;">View</a>
                                <button type="button" class="btn" data-action="edit-project" data-project-id="${rawProjectId}" data-project-title="${escapeHTML(title)}" data-project-description="${escapeHTML(description)}" data-project-start-date="${escapeHTML(startDate)}" data-project-end-date="${escapeHTML(endDate)}" style="width:auto;">Edit</button>
                                <button type="button" class="btn btn-danger" data-action="delete-project" data-project-id="${rawProjectId}" data-project-title="${escapeHTML(title)}" style="width:auto;">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        projectsList.innerHTML = '<p style="color:var(--danger)">Failed to load projects. Please try again.</p>';
    } finally {
        loader.style.display = 'none';
    }
}

initDashboardProjectActions();
