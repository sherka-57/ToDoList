
//Adding tags
// Reordered script.js: ensure variables are declared before any functions that use them
// Element references (declare first so functions can rely on them)
const btnTag = document.getElementById("tagButton");
const userTagInput = document.getElementById("tagField");
const tempTags = document.getElementById("tempTags");
const noteGrid = document.querySelector(".note-grid");


const txtArea = document.getElementById("msg");
const taskBtn = document.getElementById("nameButton");
const taskInput = document.getElementById("nameField");
const fullTags = document.getElementById('fullTags');


const loginPopup = document.getElementById("loginPopup");
const closeLogin = document.getElementById("closeLogin");
const loginSubmit = document.getElementById("loginSubmit");

const userArea = document.getElementById("userArea");
const userIcon = document.getElementById("userIcon");
const userPopup = document.getElementById("userPopup");
const userEmailDiv = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");


const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const registerSubmit = document.getElementById("registerSubmit");
const noteCreationSection = document.getElementById("noteCreationSection");
const allTagsSection = document.getElementById("allTagsSection");

const noteDateInput = document.getElementById("noteDate");





// active filter tags (multi-select) - notes must contain ALL tags in this set to be shown
const activeFilterTags = new Set();
// current search query from navbar search input (used together with tag filters)
let currentSearchQuery = '';
let notesState = [];
let editingNoteId = null;
let editingNoteCard = null;


const APP_STORAGE_KEY = 'todo_notes_v1';
const TAG_FILTER_KEY = 'todo_active_filters_v1';

let isAuthenticated = false;
let isLoggedIn = false;
let guestNotes = [];

loginPopup.addEventListener("click", e => e.stopPropagation());
loginPopup.addEventListener("mousedown", e => e.stopPropagation());

const API_BASE_URL = "/api/todos";


// ================= API =================
// Load user info on page load

async function checkAuthAndUpdateUI() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });

    if (!res.ok) throw new Error();

    const user = await res.json();


    await fetchTodos(); // ✅ THIS is what populates notes
  } catch {
    setLoggedOutUI();
  }
}

function setLoggedInUI(user) {
  userIcon.classList.add("hidden");
  userEmailDiv.classList.remove("hidden");
  userEmailDiv.textContent = user.email;

  // 🔓 show protected sections
  if (noteCreationSection) noteCreationSection.classList.remove("hidden");
  if (allTagsSection) allTagsSection.classList.remove("hidden");
}

function setLoggedOutUI() {
  userIcon.classList.remove("hidden");
  userEmailDiv.classList.add("hidden");
  userEmailDiv.textContent = "";
  userPopup.classList.add("hidden");

  // 🔒 hide protected sections
  if (noteCreationSection) noteCreationSection.classList.add("hidden");
  if (allTagsSection) allTagsSection.classList.add("hidden");
}

function showLoginForm() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
}

function showRegisterForm() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
}

showLoginBtn.addEventListener("click", showLoginForm);
showRegisterBtn.addEventListener("click", showRegisterForm);

registerSubmit.addEventListener("click", async () => {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    alert("Registration failed");
    return;
  }

  // auto-login
  const loginRes = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });

  if (!loginRes.ok) {
    alert("Registered, but login failed");
    return;
  }

  const user = await loginRes.json();
  loginPopup.classList.add("hidden");
  setLoggedInUI(user);
  await fetchTodos();
});

async function initAuth() {
  const res = await fetch("/api/auth/me", { credentials: "include" });

  if (res.ok) {
    const user = await res.json();

  }
}

initAuth();

async function initApp() {
  const res = await fetch("/api/auth/me", { credentials: "include" });

  if (res.ok) {
    const user = await res.json();
    setLoggedInUI(user);
    await fetchTodos();
  } else {
    setLoggedOutUI();
    clearUserState();
  }
}

// Fetch todos from backend API
async function fetchTodos() {
  const res = await fetch("/api/todos", { credentials: "include"});
  if (res.status === 401) {
    notesState = [];
    return;
  }
  notesState = await res.json();
  renderNotesFromState();
}

async function createTodo(todo) {
  await fetch(API_BASE_URL, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo)
  });
  fetchTodos();
}

async function deleteTodo(id) {
  await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  fetchTodos();
}

async function updateTodo(id, data) {
  await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  exitEditMode();
  fetchTodos();
}


function clearUserState() {
  notesState = [];
  if (noteGrid) noteGrid.innerHTML = "";
}


loginPopup.addEventListener("click", (e) => {
  e.stopPropagation();
});



function updateNotesVisibility() {
  const notes = Array.from(document.querySelectorAll('.note'));
  const query = (currentSearchQuery || '').trim().toLowerCase();
  notes.forEach(card => {
    // tags: note must contain all active filter tags (AND)
    let tagsMatch = true;
    if (activeFilterTags.size) {
      const cardTagEls = Array.from(card.querySelectorAll('.note-tags span[data-tag]'));
      const cardTagSet = new Set(cardTagEls.map(s => s.dataset.tag));
      tagsMatch = Array.from(activeFilterTags).every(t => cardTagSet.has(t));
    }

    // search: match against note visible text (title, excerpt, tags, body)
    let searchMatch = true;
    if (query.length) {
      const txt = (card.textContent || '').toLowerCase();
      searchMatch = txt.indexOf(query) !== -1;
    }

    card.style.display = (tagsMatch && searchMatch) ? '' : 'none';
  });
}


if (loginSubmit) {
  loginSubmit.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

  if (res.ok) {
    const user = await res.json();
    loginPopup.classList.add("hidden");
    setLoggedInUI(user);
    await fetchTodos();
  } else {
      alert("Login failed");
  }
  });
}

userIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  loginPopup.classList.toggle("hidden");
  userPopup.classList.add("hidden");
});

userEmailDiv.addEventListener("click", (e) => {
  e.stopPropagation();
  userPopup.classList.toggle("hidden");
  loginPopup.classList.add("hidden");
});


logoutBtn.addEventListener("click", async () => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });
  window.location.reload();
});


// === [Tag Filter Handlers] ===

function selectTagSpan(span) {
  if (!span || !span.dataset) return;
  const tag = span.dataset.tag;
  if (!tag) return;
  activeFilterTags.add(tag);
  span.classList.add('active-filter');
  try { fullTags.prepend(span); } catch (e) {}
  updateNotesVisibility();
  // Persist active filters
  saveFilters();
}
function deselectTagSpan(span) {
  if (!span || !span.dataset) return;
  const tag = span.dataset.tag;
  if (!tag) return;
  activeFilterTags.delete(tag);
  span.classList.remove('active-filter');
  updateNotesVisibility();
  // Persist active filters
  saveFilters();
}
function toggleFilterForSpan(span) {
  if (!span || !span.dataset) return;
  const tag = span.dataset.tag;
  if (!tag) return;
  if (activeFilterTags.has(tag)) {
    deselectTagSpan(span);
  } else {
    selectTagSpan(span);
  }
  // Persist active filters (safety if selection logic changes)
  saveFilters();
}
function ensureFullTagClickable(span) {
  if (!span || span._clickable) return;
  span.style.cursor = 'pointer';
  span.tabIndex = 0;
  span.addEventListener('click', () => toggleFilterForSpan(span));
  span.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFilterForSpan(span);
    }
  });
  span._clickable = true;
}
// Helper: get normalized tag text from a tag element
function getTagTextFromElem(el) {
  if (!el) return '';
  if (el.dataset && el.dataset.tag) return el.dataset.tag;
  if (el.firstChild && el.firstChild.textContent) return el.firstChild.textContent.trim();
  return (el.textContent || '').trim();
}
// Helper: create a remove button wired to removeTagAndFull for given tag element
function createRemoveButtonFor(tagEl) {
  const b = document.createElement('button');
  b.textContent = '✖';
  b.classList.add('remove-tag');
  b.addEventListener('click', () => removeTagAndFull(tagEl));
  return b;
}
// Helper: remove a tag element and its matching entries from #fullTags
function removeTagAndFull(tagEl) {
  const text = (tagEl.dataset && tagEl.dataset.tag) ? tagEl.dataset.tag : (tagEl.firstChild ? tagEl.firstChild.textContent.trim() : tagEl.textContent.trim());
  // remove the tag element from wherever it is (note or temp)
  if (tagEl && tagEl.remove) tagEl.remove();
  // update counts in #fullTags (removes the entry only when count becomes 0)
  updateFullTagCount(text);
}
// Update or create the tag entry in #fullTags showing how many notes reference it
function updateFullTagCount(text) {
  if (!fullTags) return;
  // count how many note tags currently reference this text (use dataset.tag for reliability)
  const remainingNoteTags = Array.from(document.querySelectorAll('.note .note-tags span')).filter(s => s.dataset && s.dataset.tag === text);
  const count = remainingNoteTags.length;
  // find existing fullTags span by data-tag among direct children
  const existing = Array.from(fullTags.children).find(s => s.dataset && s.dataset.tag === text);
  if (count === 0) {
    if (existing) existing.remove();
    return;
  }
  if (!existing) {
    const spanFull = document.createElement('span');
    spanFull.dataset.tag = text;
    // create a separate text node span and a count span for reliable matching
    const textSpan = document.createElement('span');
    textSpan.className = 'tag-text';
    textSpan.textContent = text;
    const countSpan = document.createElement('span');
    countSpan.className = 'tag-count';
    countSpan.textContent = `(${count})`;
    spanFull.appendChild(textSpan);
    spanFull.appendChild(countSpan);
    fullTags.appendChild(spanFull);
    // make this new fullTags entry interactive for filtering
    ensureFullTagClickable(spanFull);
  } else {
    let countSpan = existing.querySelector('.tag-count');
    if (!countSpan) {
      countSpan = document.createElement('span');
      countSpan.className = 'tag-count';
      existing.appendChild(countSpan);
    }
    countSpan.textContent = `(${count})`;
  }
  // Show horizontal scrollbar on #fullTags only when it actually overflows
  if (fullTags) {
    if (fullTags.scrollWidth > fullTags.clientWidth + 1) fullTags.classList.add('show-scroll'); else fullTags.classList.remove('show-scroll');
  }
}

// Persist/restore active tag filters to localStorage so selections survive reloads
function saveFilters() {
  try {
    const arr = Array.from(activeFilterTags);
    localStorage.setItem(TAG_FILTER_KEY, JSON.stringify(arr));
  } catch (e) { /* ignore storage errors */ }
}

function loadFilters() {
  try {
    const raw = localStorage.getItem(TAG_FILTER_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    arr.forEach(t => activeFilterTags.add(t));
  } catch (e) { /* ignore parse errors */ }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function nl2br(str) {
  if (!str) return "";
  return str.replace(/\n/g, "<br>");
}


// === [Factory] Build a note card from saved data (structure preserved) ===
function createNoteCardFromData(noteObj) {

  const body =
  noteObj.content ??
  noteObj.body ??
  noteObj.description ??
  "";

  const dueDate = noteObj.due_date;

  function formatDate(d) {
  if (!d) return "";
    const [year, month, day] = d.split("-").map(Number);
    return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
  }


 
  const excerptText = body.length > 220 ? body.slice(0, 220) + "…" : body;


  const card = document.createElement("div");
  card.className = "note";
  card.dataset.id = noteObj.id;


  card.innerHTML = `
  <div class="note-card">
    <div class="note-front">
      
      <div class="note-header">
        <span class="note-title">${escapeHtml(noteObj.title)}</span>
        <div class="note-header-actions">
          <button class="edit-note">✎</button>
          <button class="remove-note">✖</button>
        </div>
      </div>

      <div class="note-excerpt">
        <p>${nl2br(excerptText)}</p>
      </div>

      <div class="note-tags"></div>

      <div class="note-footer">
        ${noteObj.due_date ? `Due date: ${formatDate(noteObj.due_date)}` : "&nbsp;"}
      </div>
    </div> <!-- ✅ CLOSE note-front -->


    <div class="note-back">
      <div class="note-body"><p>${nl2br(body)}</p></div>
      <div class="note-actions"><button class="show-less">Close</button></div>
    </div>
  </div>
`;


  // Insert the new card into the DOM first so tag counting sees it
  if (noteGrid) noteGrid.append(card);

  const noteTagContainer = card.querySelector(".note-tags");


  // Build tag spans exactly like runtime creates
  noteObj.tags.forEach(text => {
    if (!text) return;
    const span = document.createElement('span');
    span.dataset.tag = text;
    span.appendChild(document.createTextNode(text));

    noteTagContainer.appendChild(span);
    updateFullTagCount(text);
  });

  // Read-more button + handlers identical to existing behavior
  const excerptEl = card.querySelector('.note-excerpt');
  if (excerptEl) {
    const readMoreBtn = document.createElement('button');
    readMoreBtn.className = 'read-more';
    readMoreBtn.setAttribute('aria-label', 'Expand');
    readMoreBtn.title = 'Expand';
    readMoreBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M6 9l6 6 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    excerptEl.appendChild(readMoreBtn);
    readMoreBtn.addEventListener('click', () => card.classList.add('flipped'));
  }

  const showLessBtn = card.querySelector('.show-less');
  if (showLessBtn) showLessBtn.addEventListener('click', () => card.classList.remove('flipped'));

  const editBtn = card.querySelector('.edit-note');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      enterEditMode(noteObj, card);
    });
  }


  // Remove note button: remove tags, card, and persist
  const removeNoteBtn = card.querySelector('.remove-note');
  if (removeNoteBtn) {
    removeNoteBtn.addEventListener('click', () => {
      
      const id = card.dataset.id;
      deleteTodo(id);
    });
  }

  // Apply clipping and tag scrollbar visibility
  const ex = card.querySelector('.note-excerpt');
  if (ex) {
    if (ex.scrollHeight > ex.clientHeight + 2) ex.classList.add('clipped'); else ex.classList.remove('clipped');
  }
  if (noteTagContainer) {
    if (noteTagContainer.scrollWidth > noteTagContainer.clientWidth + 1) noteTagContainer.classList.add('show-scroll'); else noteTagContainer.classList.remove('show-scroll');
  }



  // Respect any active filters after render
  updateNotesVisibility();

  // Keep UI states updated on resize
  window.addEventListener('resize', () => {
    const ex2 = card.querySelector('.note-excerpt');
    if (ex2) {
      if (ex2.scrollHeight > ex2.clientHeight + 2) ex2.classList.add('clipped'); else ex2.classList.remove('clipped');
    }
    const tags = card.querySelector('.note-tags');
    if (tags) {
      if (tags.scrollWidth > tags.clientWidth + 1) tags.classList.add('show-scroll'); else tags.classList.remove('show-scroll');
    }
  });

  return card;
}

function enterEditMode(note, card) {
  // Exit previous edit
  if (editingNoteCard) {
    editingNoteCard.classList.remove('editing');
  }

  editingNoteId = note.id;
  editingNoteCard = card;
  card.classList.add('editing');

  // Fill inputs
  taskInput.value = note.title;
  txtArea.value = note.content || '';
  noteDateInput.value = note.due_date || '';

  // Clear tempTags
  tempTags.innerHTML = '';

  // Move tags into tempTags
  note.tags.forEach(tag => {
    const span = document.createElement('span');
    span.dataset.tag = tag;
    span.textContent = tag;
    span.appendChild(createRemoveButtonFor(span));
    tempTags.appendChild(span);
  });

  // Scroll to creation panel
  document.getElementById('noteCreationSection')
    .scrollIntoView({ behavior: 'smooth' });
}

function exitEditMode() {
  if (editingNoteCard) {
    editingNoteCard.classList.remove('editing');
  }

  editingNoteId = null;
  editingNoteCard = null;

  taskInput.value = '';
  txtArea.value = '';
  noteDateInput.value = '';
  tempTags.innerHTML = '';
}

// === [Serializer] Capture current DOM into notesState and save ===
function serializeNotesFromDOM() {
  const cards = Array.from(document.querySelectorAll('.note'));
  notesState = cards.map(card => {
    // Title text is the text content before the remove button
    const header = card.querySelector('.note-header');
    let title = '';
    if (header) {
      const nodes = Array.from(header.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
      title = nodes.length ? nodes.map(n => n.textContent).join('').trim() : header.textContent.replace('✖','').trim();
    }
    const bodyEl = card.querySelector('.note-back .note-body p');
    const body = bodyEl ? bodyEl.innerHTML.replace(/<br\s*\/?>/gi, '\n') : '';
    const tags = Array.from(card.querySelectorAll('.note-tags span[data-tag]')).map(s => s.dataset.tag);
    return { title, body, tags};
  });
  
}

// === [Renderer] Build notes from saved state ===
function renderNotesFromState() {
  if (!noteGrid) return;
  noteGrid.innerHTML = '';        // clear any placeholder notes

  // Reset All Tags rail; counts are rebuilt during note creation
  if (fullTags) fullTags.innerHTML = '';

  notesState.forEach(n => createNoteCardFromData(n));
 
  // Make All Tags entries clickable and reflect active-filter UI
  if (fullTags) {
    Array.from(fullTags.children).forEach(ch => {
      ensureFullTagClickable(ch);
      if (ch.dataset && activeFilterTags.has(ch.dataset.tag)) {
        ch.classList.add('active-filter');
      }
    });
  }

  // Apply restored active filters
  updateNotesVisibility();
}

// Tag creation handler
if (btnTag) {
  btnTag.addEventListener("click", () => {
    if (!userTagInput || !tempTags) return;
    let userValue = (userTagInput.value || '').trim();
    if (userValue === "") return;
    if (!userValue.startsWith("#")) {
      userValue = "#" + userValue.replace("#", "");
    }
    const existingTags = tempTags ? [...tempTags.querySelectorAll("span")].map(tag => getTagTextFromElem(tag)) : [];
    if (existingTags.includes(userValue)) {
      userTagInput.value = "";
      return;
    }
    const newTag = document.createElement("span");
    const tagText = document.createTextNode(userValue);
    // store normalized tag text for reliable matching across containers
    newTag.dataset.tag = userValue;
    const removeBtn = createRemoveButtonFor(newTag);
    newTag.appendChild(tagText);
    newTag.appendChild(removeBtn);
    tempTags.appendChild(newTag);
    userTagInput.value = "";
  });
}

// Task creation handler
if (taskBtn) {
  taskBtn.addEventListener("click", () => {

    const dueDate = noteDateInput?.value || null;

    if (!noteGrid || !tempTags || !txtArea || !taskInput) return;
    let taskName = (taskInput.value || '').trim();
    let taskDesc = (txtArea.value || '').trim();
    if (taskName === "" || taskDesc === "") return;
    // helper to escape HTML in user content
    function escapeHtml(s) {
      return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
    }
    function nl2br(s) { return escapeHtml(s).replace(/\n/g, '<br>'); }
    // create an excerpt (short preview) for the front of the card
    const EXCERPT_CHARS = 220;
    const excerptText = taskDesc.length > EXCERPT_CHARS ? taskDesc.slice(0, EXCERPT_CHARS).trim() + '…' : taskDesc;
    let card = document.createElement("div");
    card.className = "note";

    // format due date for display (mm/dd/yyyy) when creating a new note
    const formattedDue = dueDate ? (() => {
      try {
        const d = new Date(dueDate);
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
      } catch (e) { return '' }
    })() : '';
    
    card.innerHTML = `
  <div class="note-card">
    <div class="note-front">
      <div class="note-header">
        ${escapeHtml(taskName)}
        <button class="remove-note">✖</button>
      </div>

      <div class="note-excerpt">
        <p>${nl2br(excerptText)}</p>
      </div>

      <div class="tags note-tags"></div>

      <div class="note-footer">
        ${formattedDue ? `Due date: ${formattedDue}` : ""}
      </div>

    </div>

    <div class="note-back">
      <div class="note-body"><p>${nl2br(taskDesc)}</p></div>
      <div class="note-actions"><button class="show-less">Close</button></div>
    </div>
  </div>
`;

   

    // Move all tags from the temp tag container into the new note's tag area
    const noteTagContainer = card.querySelector('.note-tags');
    // Ensure the note-tags container sits inside the front of the card (bottom of front)
    const front = card.querySelector('.note-front');
    if (noteTagContainer && front && noteTagContainer.parentElement !== front) {
      front.appendChild(noteTagContainer);
    }
    const tempTagSpans = Array.from(tempTags.querySelectorAll('span'));
    tempTagSpans.forEach(orig => {
      // capture text before manipulating the element
      const text = orig.firstChild ? orig.firstChild.textContent.trim() : orig.textContent.trim();
      if (!text) return;
      // append the existing tag element into the note (this removes it from tempTags)
      noteTagContainer.appendChild(orig);
      
      // update the main tags list counts (will create or update the entry)
      updateFullTagCount(text);
    });
    // Ensure the tag area shows from the start (left-most) when the note is created
    if (noteTagContainer) noteTagContainer.scrollLeft = 0;
    // move the tags container into the front so tags are at the bottom of the front
    if (noteTagContainer && front && noteTagContainer.parentElement !== front) front.appendChild(noteTagContainer);
    // create and place the read-more button inside the excerpt (it will be shown only if clipped)
    const excerptEl = card.querySelector('.note-excerpt');
    let readMoreBtn = null;
    if (excerptEl) {
      readMoreBtn = document.createElement('button');
      readMoreBtn.className = 'read-more';
      readMoreBtn.setAttribute('aria-label', 'Expand');
      readMoreBtn.title = 'Expand';
      // insert a chevron SVG so the button shows an icon instead of text
      readMoreBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M6 9l6 6 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      excerptEl.appendChild(readMoreBtn);
      readMoreBtn.addEventListener('click', () => card.classList.add('flipped'));
    }
    // helper: show horizontal scrollbar only when tags overflow
    function updateTagScrollVisibilityFor(node) {
      const tags = node.querySelector('.note-tags');
      if (!tags) return;
      if (tags.scrollWidth > tags.clientWidth + 1) tags.classList.add('show-scroll'); else tags.classList.remove('show-scroll');
    }
    // If the excerpt overflows after tags move, update its clipped state
    function updateClipForCard(c) {
      const ex = c.querySelector('.note-excerpt');
      if (!ex) return;
      if (ex.scrollHeight > ex.clientHeight + 2) ex.classList.add('clipped'); else ex.classList.remove('clipped');
      updateTagScrollVisibilityFor(c);
    }
    // Wire the note-level remove button to delete the whole note
    // and remove its tags from the main tags container
    const removeNoteBtn = card.querySelector('.remove-note');
    if (removeNoteBtn) removeNoteBtn.addEventListener('click', () => {
      const noteTagSpans = Array.from(card.querySelectorAll('.note-tags span'));
      noteTagSpans.forEach(tagEl => removeTagAndFull(tagEl));

      const id = card.dataset.id;
      deleteTodo(id);
    });
    // Wire show-less handler (close on back)
    const showLessBtn = card.querySelector('.show-less');
    if (showLessBtn) showLessBtn.addEventListener('click', () => {
      card.classList.remove('flipped');
    });
    // After wiring flip handlers, ensure excerpt clipping/fade state is correct
    // run for the new card
    updateClipForCard(card);
    // apply active multi-tag + search filter to this newly created card so it respects the current selection
    if (activeFilterTags.size || (currentSearchQuery || '').trim().length) {
      const query = (currentSearchQuery || '').trim().toLowerCase();
      let tagsMatch = true;
      if (activeFilterTags.size) {
        const cardTagEls = Array.from(card.querySelectorAll('.note-tags span[data-tag]'));
        const cardTagSet = new Set(cardTagEls.map(s => s.dataset.tag));
        tagsMatch = Array.from(activeFilterTags).every(t => cardTagSet.has(t));
      }
      let searchMatch = true;
      if (query.length) {
        const txt = (card.textContent || '').toLowerCase();
        searchMatch = txt.indexOf(query) !== -1;
      }
      card.style.display = (tagsMatch && searchMatch) ? '' : 'none';
    }
    // also update on window resize
    window.addEventListener('resize', () => updateClipForCard(card));

   
    const tags = Array.from(card.querySelectorAll('.note-tags span[data-tag]')).map(s => s.dataset.tag);
    
    if (editingNoteId) {
      updateTodo(editingNoteId, {
        title: taskName,
        content: taskDesc,
        tags,
        due_date: dueDate
      });
    } else {
      createTodo({
        title: taskName,
        content: taskDesc,
        tags,
        due_date: dueDate
      });
    }



    if (noteDateInput) noteDateInput.value = "";

    txtArea.value = "";
    taskInput.value = "";
  });
};

// Initialize flip/read-more handlers and clipping for existing notes on the page
function initExistingNotes() {
  // restore persisted filters before initializing UI
  loadFilters();
  const notes = Array.from(document.querySelectorAll('.note'));
  notes.forEach(card => {
    // attach remove handler if present
    const removeNoteBtn = card.querySelector('.remove-note');
    if (removeNoteBtn && !removeNoteBtn._attached) {
      removeNoteBtn.addEventListener('click', () => {
        const noteTagSpans = Array.from(card.querySelectorAll('.note-tags span'));
        noteTagSpans.forEach(tagEl => removeTagAndFull(tagEl));
        
        const id = card.dataset.id;
        deleteTodo(id);
      });
      removeNoteBtn._attached = true;
    }
    const readMoreBtn = card.querySelector('.read-more');
    const showLessBtn = card.querySelector('.show-less');
    // ensure tags are inside the front for existing notes (in case HTML placed them outside)
    const existingTags = card.querySelector('.note-tags');
    const front = card.querySelector('.note-front');
    if (existingTags && front && existingTags.parentElement !== front) front.appendChild(existingTags);
    // if there is a read-more button outside the excerpt (from older markup), move it into the excerpt
    const ex = card.querySelector('.note-excerpt');
    if (readMoreBtn && ex && readMoreBtn.parentElement !== ex) {
      ex.appendChild(readMoreBtn);
    }
    // normalize existing read-more buttons: use an accessible chevron icon and wire handler
    if (readMoreBtn) {
      readMoreBtn.setAttribute('aria-label', 'Expand');
      readMoreBtn.title = 'Expand';
      readMoreBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M6 9l6 6 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }
    if (readMoreBtn && !readMoreBtn._attached) {
      readMoreBtn.addEventListener('click', () => card.classList.add('flipped'));
      readMoreBtn._attached = true;
    }
    if (showLessBtn && !showLessBtn._attached) {
      showLessBtn.addEventListener('click', () => card.classList.remove('flipped'));
      showLessBtn._attached = true;
    }
    // update clip for excerpt and show/hide tag scrollbar
    if (ex) {
      if (ex.scrollHeight > ex.clientHeight + 2) ex.classList.add('clipped'); else ex.classList.remove('clipped');
    }
    // update tag scrollbar visibility
    if (existingTags) {
      if (existingTags.scrollWidth > existingTags.clientWidth + 1) existingTags.classList.add('show-scroll'); else existingTags.classList.remove('show-scroll');
    }
  });
  // ensure existing #fullTags entries are interactive
  if (fullTags) {
    Array.from(fullTags.children).forEach(ch => ensureFullTagClickable(ch));
  }
}

// --- Persistence hook: wrap removeTagAndFull to save after tag removal ---
const _original_removeTagAndFull = removeTagAndFull;
removeTagAndFull = function(tagEl) {
  _original_removeTagAndFull(tagEl); // original behavior
  serializeNotesFromDOM();           // persist current notes after tag removal
};

// run on load
document.addEventListener('DOMContentLoaded', initExistingNotes);

// Render notes from saved state on load (clears placeholders and rebuilds)
document.addEventListener('DOMContentLoaded', () => {
  checkAuthAndUpdateUI();
});

// Wire navbar search input after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('navSearch');
  if (!search) return;
  search.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value || '';
    updateNotesVisibility();
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      search.value = '';
      currentSearchQuery = '';
      updateNotesVisibility();
    }
  });
});


document.addEventListener("click", () => {
  loginPopup.classList.add("hidden");
  userPopup.classList.add("hidden");
});


loginPopup.addEventListener("click", e => e.stopPropagation());
userPopup.addEventListener("click", e => e.stopPropagation());


initApp();