const redactions = [
    { id: 0, originalText: 'Jane Doe', suggestedText: '[Witness A]', status: 'pending' },
    { id: 1, originalText: '123 Maple Street, Springfield, IL 62701', suggestedText: '[a residential address in Illinois]', status: 'pending' },
    { id: 2, originalText: 'the only female neurosurgeon at Springfield Medical Center', suggestedText: '[a medical professional at a local hospital]', status: 'pending' },
    { id: 3, originalText: 'the hospital cafeteria on the 5th floor', suggestedText: '[the workplace]', status: 'pending' },
    { id: 6, originalText: 'Dr. Michael Chen', suggestedText: '[Colleague]', status: 'pending' }
];

let currentId = null;

document.addEventListener('DOMContentLoaded', () => {
    bindHighlights();
    updateSidebar();
});

function bindHighlights() {
    document.querySelectorAll('.redaction-highlight').forEach(el => {
        el.onclick = () => openModal(+el.dataset.redaction);
    });
}

function openModal(id) {
    const r = redactions.find(x => x.id === id);
    if (!r || r.status !== 'pending') return;

    currentId = id;
    document.getElementById('modalOriginalText').textContent = r.originalText;
    document.getElementById('modalSuggestedText').textContent = r.suggestedText;
    document.getElementById('redactionModal').classList.add('active');
}

function closeModal() {
    document.getElementById('redactionModal').classList.remove('active');
}

document.getElementById('modalClose').onclick = closeModal;
document.getElementById('acceptBtn').onclick = acceptRedaction;
document.getElementById('rejectBtn').onclick = rejectRedaction;
document.getElementById('approveAllBtn').onclick = approveAll;

function acceptRedaction() {
    const r = redactions.find(x => x.id === currentId);
    document.querySelectorAll(`[data-redaction="${currentId}"]`)
        .forEach(el => el.outerHTML = r.suggestedText);
    r.status = 'accepted';
    advance();
}

function rejectRedaction() {
    const r = redactions.find(x => x.id === currentId);
    document.querySelectorAll(`[data-redaction="${currentId}"]`)
        .forEach(el => el.classList.remove('pending'));
    r.status = 'rejected';
    advance();
}

function advance() {
    closeModal();
    updateSidebar();
    const next = redactions.find(r => r.status === 'pending');
    if (next) openModal(next.id);
}

function approveAll() {
    redactions.filter(r => r.status === 'pending').forEach(r => {
        document.querySelectorAll(`[data-redaction="${r.id}"]`)
            .forEach(el => el.outerHTML = r.suggestedText);
        r.status = 'accepted';
    });
    updateSidebar();
}

function updateSidebar() {
    const pending = redactions.filter(r => r.status === 'pending');
    const accepted = redactions.filter(r => r.status === 'accepted');

    document.getElementById('redactionCount').textContent =
        pending.length ? `${pending.length} pending` : 'All reviewed';

    document.getElementById('redactionList').innerHTML =
        pending.map(r => `<div class="redaction-item">${r.originalText}</div>`).join('');

    document.getElementById('implementedList').innerHTML =
        accepted.map(r => `<div class="redaction-item accepted">${r.originalText}</div>`).join('');
}
