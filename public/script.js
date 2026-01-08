import { supabase } from "./supabaseClientBrowser.js";
// ==========================
//  SCRIPT.JS - FULL VERSION
// ==========================

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

const pageTitle = document.getElementById("PageTitle");
const instructionsOverlay = document.getElementById("instructionsOverlay");
const closeInstructions = document.getElementById("closeInstructions");



const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const registerSubmit = document.getElementById("registerSubmit");
const noteCreationSection = document.getElementById("noteCreationSection");
const allTagsSection = document.getElementById("allTagsSection");

const noteDateInput = document.getElementById("noteDate");
//const supabase = window.supabase;

const SUPABASE_URL = "https://sazdtrcayjljgmihilkj.supabase.co";  // replace with your Supabase URL
const SUPABASE_ANON_KEY = "sb_publishable_8PjevXnceWHX2i_xoB-M7g_UYzHxq5c"; // replace with your public anon key

//import { supabase } from "./supabaseClientBrowser.js";
// active filter tags (multi-select) - notes must contain ALL tags in this set to be shown
const activeFilterTags = new Set();
// current search query from navbar search input (used together with tag filters)
let currentSearchQuery = '';
let notesState = [];
let editingNoteId = null;
let editingNoteCard = null;

loginPopup.addEventListener("click", e => e.stopPropagation());
loginPopup.addEventListener("mousedown", e => e.stopPropagation());

//const API_BASE_URL = "/.netlify/functions";
const API_BASE_URL = "/api";



// ================= API =================
// Load user info on page load

// check auth
async function checkAuthAndUpdateUI() {
  try {
    // Get the current session
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data.session;

    if (!session) {
      // No user logged in
      setLoggedOutUI();
      clearUserState();
      return;
    }

    // Get user info
    const { user } = session;
    setLoggedInUI(user);

    // Fetch notes for this user
    await fetchTodos();

  } catch (err) {
    console.error("Auth check failed:", err.message);
    setLoggedOutUI();
    clearUserState();
  }
}


function setLoggedInUI(user) {
  userIcon.classList.add("hidden");
  userEmailDiv.classList.remove("hidden");
  userEmailDiv.textContent = user.email;

  noteCreationSection.classList.remove("hidden");
  allTagsSection.classList.remove("hidden");
}

function setLoggedOutUI() {
  userIcon.classList.remove("hidden");
  userEmailDiv.classList.add("hidden");
  userEmailDiv.textContent = "";
  userPopup.classList.add("hidden");

  noteCreationSection.classList.add("hidden");
  allTagsSection.classList.add("hidden");
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

// -------- SIGNUP --------
registerSubmit.addEventListener("click", async () => {
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password
    });

    if (error) {
      console.error(error.message);
      alert("Registration failed: " + error.message);
      return;
    }

    loginPopup.classList.add("hidden");
    setLoggedInUI(data.user); // update UI
    await fetchTodos();        // fetch user notes
  } catch (err) {
    console.error(err);
    alert("Unexpected error during signup");
  }
});

// -------- LOGIN --------
loginSubmit.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      console.error(error.message);
      alert("Login failed: " + error.message);
      return;
    }

    loginPopup.classList.add("hidden");
    setLoggedInUI(data.user); // update UI
    await fetchTodos();        // fetch user notes
  } catch (err) {
    console.error(err);
    alert("Unexpected error during login");
  }
});


async function fetchTodos() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.log("No active session. User not logged in.");
    return;
  }

  const { data: todos, error } = await supabase
    .from("Todos")
    .select("*")
    .eq("user_id", session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch todos:", error.message);
    return;
  }

  notesState = Array.isArray(todos) ? todos : [];
  renderNotesFromState();
}

async function createTodo(todo) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error("No active session");
    return;
  }

  const { error } = await supabase
    .from("Todos")
    .insert({
      ...todo,                 // e.g., { title: "Test", content: "..." }
      user_id: session.user.id  // MUST include user_id for RLS
    });

  if (error) {
    console.error("Failed to create todo:", error.message);
    return;
  }

  await fetchTodos();
}


async function deleteTodo(id) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error("No active session");
    return;
  }

  const { error } = await supabase
    .from("Todos")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id); // ensures user can only delete own todos

  if (error) {
    console.error("Failed to delete todo:", error.message);
    return;
  }

  await fetchTodos();
}


async function updateTodo(id, updatedFields) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.error("No active session");
    return;
  }

  const { error } = await supabase
    .from("Todos")
    .update({
      ...updatedFields,         // e.g., { title: "new title", content: "new content" }
      updated_at: new Date()    // automatically update timestamp
    })
    .eq("id", id)
    .eq("user_id", session.user.id); // ensures only the owner can update

  if (error) {
    console.error("Failed to update todo:", error.message);
    return;
  }

  exitEditMode();   // keep your UI helper
  await fetchTodos(); // refresh notes
}




function clearUserState() {
  notesState = [];
  if (noteGrid) noteGrid.innerHTML = "";
}


loginPopup.addEventListener("click", (e) => {
  e.stopPropagation();
});

function highlightText(element, query) {
  if (!element) return;
  const text = element.textContent;
  if (!query) {
    element.innerHTML = text; // reset if no query
    return;
  }

  // Escape special characters in query for regex
  const escapedQuery = query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  // Wrap matches in a span with highlight class
  element.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
}

// Returns a semi-transparent gradient for due date urgency
function getDueDateGradient(dueDateStr) {
  if (!dueDateStr) return ''; // no due date

  const today = new Date();
  const dueDate = new Date(dueDateStr);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let redPercent;
  if (diffDays <= 0) redPercent = 100;   // overdue: full red
  else if (diffDays >= 10) redPercent = 0; // more than 10 days: full blue
  else redPercent = (10 - diffDays) * 10;  // 1 day → 90%, 2 days → 80%

  // Colors
  const redColor = '#ff5555';
  const blueColor = '#57c7ff';

  // Add a tiny transition/fade at the edge (1% of the width)
  const fade = 1; // 1% fade for smooth edge

  // Clamp percentages for gradient stops
  const redEnd = Math.min(redPercent, 100);
  const blueStart = Math.max(redPercent - fade, 0);

  return `linear-gradient(to right, 
           ${redColor} 0%, 
           ${redColor} ${blueStart}%, 
           ${redColor} ${redEnd}%, 
           ${blueColor} ${redEnd}%, 
           ${blueColor} 100%)`;
}





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

    // ---- HIGHLIGHTING ----
  const titleEl = card.querySelector('.note-title');
  const excerptEl = card.querySelector('.note-excerpt p');
  const tagEls = Array.from(card.querySelectorAll('.note-tags span'));

  // Highlight title and excerpt
  highlightText(titleEl, query);
  highlightText(excerptEl, query);

  // Highlight tags if they match
  tagEls.forEach(tag => {
    if (query && tag.dataset.tag.toLowerCase().includes(query)) {
      tag.classList.add('highlight');
    } else {
      tag.classList.remove('highlight');
    }
  });



    
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
await supabase.auth.signOut();
setLoggedOutUI();
clearUserState();

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
 
}
function deselectTagSpan(span) {
  if (!span || !span.dataset) return;
  const tag = span.dataset.tag;
  if (!tag) return;
  activeFilterTags.delete(tag);
  span.classList.remove('active-filter');
  updateNotesVisibility();
  // Persist active filters

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

// Open instructions modal
pageTitle.addEventListener("click", (e) => {
  e.stopPropagation();
  instructionsOverlay.classList.remove("hidden");
});

// Close modal (X button)
closeInstructions.addEventListener("click", () => {
  instructionsOverlay.classList.add("hidden");
});

// Click outside modal closes it
instructionsOverlay.addEventListener("click", () => {
  instructionsOverlay.classList.add("hidden");
});

// Prevent inner clicks from closing
document.getElementById("instructionsModal")
  .addEventListener("click", e => e.stopPropagation());



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

const footer = card.querySelector(".note-footer");
const header = card.querySelector(".note-header");

if (footer && noteObj.due_date && header) {
  const today = new Date();
  const dueDate = new Date(noteObj.due_date);
  const diffDays = Math.floor((dueDate - today) / (1000*60*60*24));

  // Remove any previous pulse classes
  footer.classList.remove("pulse-red", "pulse-yellow");
  header.classList.remove("pulse-red", "pulse-yellow");

  if (diffDays < 0) {
    // Overdue → red pulse
    footer.classList.add("pulse-red");
    header.classList.add("pulse-red");
  } else if (diffDays === 0) {
    // Due today → yellow pulse
    footer.classList.add("pulse-yellow");
    header.classList.add("pulse-yellow");
  } else {
    // Future → normal gradient
    footer.style.background = getDueDateGradient(noteObj.due_date);
    footer.style.color = '#fff';
    header.style.background = ''; // remove pulse effect if any
  }

  footer.style.padding = '4px 8px';
}



    
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

// =======================
// Page Initialization
// =======================
document.addEventListener('DOMContentLoaded', async () => {
  // 1️⃣ Check auth and update UI
  await checkAuthAndUpdateUI();

  // 2️⃣ Initialize search input
  const searchInput = document.querySelector("#navSearch");
  if (searchInput) {
    // Start with empty search
    searchInput.value = "";
    currentSearchQuery = "";

    // Update filter as user types
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value || '';
      updateNotesVisibility();
    });

    // Clear search on Escape key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        currentSearchQuery = '';
        updateNotesVisibility();
      }
    });
  }

  // 3️⃣ Initialize existing notes on page
  initExistingNotes();
});


// Click outside to hide popups
document.addEventListener("click", () => {
  loginPopup.classList.add("hidden");
  userPopup.classList.add("hidden");
});

// Click inside popups should not close them
[loginPopup, userPopup].forEach(popup => {
  if (popup) {
    popup.addEventListener("click", (e) => e.stopPropagation());
  }
});

// Optional: ensure user is signed out when closing tab/window
window.addEventListener('beforeunload', async () => {
  await supabase.auth.signOut();
});












