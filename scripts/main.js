let notebooks = [];
let notes = [];
let initSettings = {
   search: {
      caseSensitive: false
   },
   autocomplete: {
      parentheses: true,
      brackets: true,
      braces: true
   },
   activeNotebook: "not set",
   font: "'EB Garamond', serif",
   wordCount: true
}
let settings = {}

if (localStorage.getItem("notetakersettings")) {
   settings = JSON.parse(localStorage.getItem("notetakersettings"));
} else settings = initSettings;

function saveSettings() {
   localStorage.setItem("notetakersettings", JSON.stringify(settings));
}

// Add items new to local save
const initSettingsKeys = Object.keys(initSettings);
for (key of initSettingsKeys) { if (settings[key] === undefined) { settings[key] = initSettings[key]; } }

// =========================================
// Load page
// =========================================

getData();

async function getData() {
   await getNotebooks();
   if (settings.activeNotebook == "not set") {
      settings.activeNotebook = notebooks[0].id;
      saveSettings();
   }
   updateNotebookList();
   console.log(notebooks)
   await getNotes(settings.activeNotebook);
   if (notes.length == 0) {
      newNote();
      return;
   }

   showLatestNote();
}

// Maybe these need to be JQuery
async function getNotebooks() {
   try {
      const response = await fetch("/getnotebooks");
      const data = await response.json();
      notebooks = data;
   } catch (error) {
      console.error(error);
   }
}

async function getNotes(notebookid) {
   try {
      const response = await fetch(`/getnotes?notebookid=${notebookid}`);
      const data = await response.json();
      notes = data;
   } catch (error) {
      console.error(error);
   }
}


// =========================================
// Save
// =========================================

let deletedNotes = [];

function clearSave() {
   if (confirm("Are you sure you want to delete your save?")) {
      notes = [];
      localStorage.setItem("notetakersave", JSON.stringify(notes));
      location.reload();
   }
}

function exportSave() {
   let txt = document.querySelector(".exportdata");
   txt.value = JSON.stringify(notes);
   txt.select();
   txt.setSelectionRange(0, 99999); // For mobile
   navigator.clipboard.writeText(txt.value);
}

function importSave() {
   if (confirm("This will delete your current save. Are you sure?")) {
      let inputTxt = prompt("Enter save...");
      notes = JSON.parse(inputTxt);
      localStorage.setItem("notetakersave", JSON.stringify(notes));
      location.reload();
   }
}

function showLatestNote() {
   if (notes.length > 0) {
      updateNoteList();
      openNote(notes[notes.length - 1].id);
   }
}

function getDeletedNotes() {
   if (localStorage.getItem("notetaker-deletednotes")) {
      deletedNotes = JSON.parse(localStorage.getItem("notetaker-deletednotes"));
   } else deletedNotes = [];
}

function setDeletedNotes() {
   localStorage.setItem("notetaker-deletednotes", JSON.stringify(deletedNotes));
}


// =========================================
// Notes
// =========================================

async function newNote() {
   if (event) event.preventDefault();

   let note = {};

   try {
      const response = await fetch(`/note-create?notebookid=${encodeURIComponent(settings.activeNotebook)}`);
      const returedData = await response.json();
      note = returedData.note;
   }
   catch (error) {
      console.error(error);
   }

   notes.push(note);
   openNote(note.id);
   addNoteToList(note);
}

async function updateNote(id, type, data) {
   let changes = {
      notebookid: settings.activeNotebook,
      id: id,
      type: type,
      change: data
   }

   $.post("/note-edit", changes);
}

async function deleteNote(id) {
   if (notes.length == 1) {
      notify("You can't delete your last note!");
      return;
   }
   $.post("/note-delete", {
      notebookid: settings.activeNotebook,
      id: id,
   });

   let noteIndex = notes.findIndex(note => note.id == id);
   let deletedNote = notes.splice(noteIndex, 1);
   getDeletedNotes();
   deletedNotes.push(deletedNote[0]);
   setDeletedNotes();
   showLatestNote();
}

document.querySelector(".note-content").addEventListener("keyup", () => {
   renderMarkdown();
});

// Get note name from id
function getNoteName(noteid) {
   let noteIndex = notes.findIndex(note => note.id == noteid);
   if (noteIndex != -1) return notes[noteIndex].name;
   else return "error - note does not exist";
}

// Open note
function tryOpenNote(id) {
   let noteIndex = notes.findIndex(note => note.id == id);
   if (noteIndex != -1) openNote(id);
}

function openNote(id) {
   let noteIndex = notes.findIndex(note => note.id == id);
   let note = notes[noteIndex];

   let noteName = document.querySelector(".note-name");
   let noteText = document.querySelector(".note-content");
   let noteId = document.querySelector(".note-id");

   noteId.textContent = note.id;

   // Display note values
   noteName.innerHTML = note.name;
   noteText.innerHTML = note.content;
   document.querySelector(".note-last-edit").textContent = "last edit at " + (note.datesEdited.length == 0 ? "never" : timeIs(new Date(note.datesEdited[note.datesEdited.length - 1]))) + " on " + (note.datesEdited.length == 0 ? "never" : dateIs(new Date(note.datesEdited[note.datesEdited.length - 1]), "quick"));
   renderMarkdown();

   document.querySelector(".delete-note").onclick = () => { deleteNote(note.id); }

   watchOpenNote(note, noteName, noteText);
}

function watchOpenNote(note, noteName, noteText) {
   // Add listeners for updates
   let nameListener;
   let textListener;

   noteName.onfocus = () => {
      nameListener = setInterval(() => {
         checkForChange(noteName, "name")
      }, 2000);
   }
   noteText.onfocus = () => {
      textListener = setInterval(() => {
         checkForChange(noteText, "content")
      }, 2000);
   }

   noteName.onblur = () => {
      clearInterval(nameListener);
      checkForChange(noteName, "name");
   }
   noteText.onblur = () => {
      clearInterval(textListener);
      checkForChange(noteText, "content");
   }

   function checkForChange(element, type) {
      if (element.innerHTML != note[type]) {
         let now = new Date();

         note[type] = element.innerHTML;
         note.datesEdited.push(now);


         updateNote(note.id, type, document.querySelector(".note-" + type).innerHTML);
         document.querySelector(".note-last-edit").textContent = "last edit at " + timeIs(now) + " on " + dateIs(now, "quick");

         let listItem = document.querySelector("#id-" + note.id);

         moveNoteToTop(listItem);
         updateNoteInList(listItem, note);
      }
   }

   function moveNoteToTop(noteEl) {
      let noteList = document.querySelector(".note-list");
      noteList.prepend(noteEl);
   }
}


// =========================================
// Notebooks
// =========================================

async function newNotebook() {
   event.preventDefault();

   let form = document.querySelector(".new-notebook");
   let name = form.name.value;
   form.name.value = "";

   const response = await fetch(`/newnotebook?name=${encodeURIComponent(name)}`);
   if (!response.ok) {
      console.error(`Request failed with status ${response.status}`);
      return;
   }

   try {
      const notebookid = await response.json();
      // console.log(response, response.json());
      settings.activeNotebook = notebookid;
      saveSettings();
      getData();
   }
   catch (error) {
      console.error(error);
   }

   closeModal("newnotebook");
}

async function deleteNotebook(id) {
   let confirmation = confirm("Are you sure you want to delete this notebook?");
   if (!confirmation) return;

   const response = await fetch(`/notebook-delete?notebookid=${encodeURIComponent(id)}`);
   const notebook = await response.json();

   await getNotebooks();
   if (settings.activeNotebook == "not set" || settings.activeNotebook == id) {
      settings.activeNotebook = notebooks[0].id;
      saveSettings();
   }
   updateNotebookList();
}

function openNotebook(id) {
   settings.activeNotebook = id;
   saveSettings();
   getData();
}

function toggleNotebookSwitcher() {
   let switcher = document.querySelector(".notebook-switcher");
   if (switcher.style.opacity == "1") {
      hideNotebookSwitcher();
   }
   else {
      switcher.style.opacity = "1";
      switcher.style.pointerEvents = "auto";
   }
}

function hideNotebookSwitcher() {
   let switcher = document.querySelector(".notebook-switcher");
   switcher.style.opacity = "0";
   switcher.style.pointerEvents = "none";
}


// =========================================
// Updating and displaying
// =========================================

function updateNoteList() {
   notes.sort((noteA, noteB) => {
      return new Date(noteA.datesEdited[noteA.datesEdited.length - 1]) - new Date(noteB.datesEdited[noteB.datesEdited.length - 1]);
   });

   document.querySelector(".note-list").innerHTML = "";
   notes.forEach(note => {
      addNoteToList(note);
   });
}

function updateNotebookList() {
   document.querySelector(".notebook-list").innerHTML = "";
   notebooks.forEach(notebook => {
      document.querySelector(".notebook-list").innerHTML += `
         <li  onclick="openNotebook('${notebook.id}'); hideNotebookSwitcher()" class="notebook-list-item my-1.5 py-2 px-4 rounded-md ${notebook.id == settings.activeNotebook ? "bg-greyplus-lightest dark:bg-greyplus-night" : "bg-greyplus-darkerwhite dark:bg-greyplus-darkblack"} cursor-pointer">
            <span class="material-symbols-rounded -ml-2 p-1">folder${notebook.id == settings.activeNotebook ? "_special" : ""}</span>
            ${notebook.title}
            ${notebooks.length > 1 ? `<span class="material-symbols-rounded -mr-2 p-1 rounded-lg bg-red-500 text-white float-right" title="delete notebook" onclick="deleteNotebook('${notebook.id}')">folder_delete</span>` : "" }
         </li>
      `;
   });
}

function addNoteToList(note) {
   let noteEl = document.createElement("div");
   let name = document.createElement("h2");
   let text = document.createElement("p");
   let lastEdit = document.createElement("p");

   name.classList.add("list-item-name");
   text.classList.add("list-item-content");
   lastEdit.classList.add("list-item-last-edit");

   noteEl.classList.add("note-list-item");
   noteEl.id = "id-" + note.id;

   noteEl.onclick = () => { openNote(note.id); }

   noteEl.append(name);
   noteEl.append(text);
   noteEl.append(lastEdit);
   document.querySelector(".note-list").prepend(noteEl);

   updateNoteInList(noteEl, note);
}

function updateNoteInList(listItem, note) {
   listItem.querySelector(".list-item-name").innerHTML = note.name;
   listItem.querySelector(".list-item-content").innerHTML = 
      note.content.length < 50
         ? parseMarkdown(note.content).replace(/<br>/g, " ")
         : parseMarkdown(note.content.slice(0, 50)).replace(/<br>/g, " ") + "...";
   listItem.querySelector(".list-item-last-edit").innerHTML = note.datesEdited.length == 0 ? "never" : dateIs(note.datesEdited[note.datesEdited.length - 1], "quick");
}


// =========================================
// Other functions
// =========================================

function getWordCount(text) {
   // Remove html tags
   text = text.innerHTML.replace(/<div>/g, "").replace(/<br>/g, "").replace(/<\/div>/g, "<br>").split("<br>").join(" ");
   // Remove special characters
   text = text.replace(/[^a-zA-Z ]/g, "");
   // Get characters
   let charCount = text.length;
   // Get a list of words
   let words = text.split(" ").filter(word => { return word.length > 0 });
   return words.length + " words - " + charCount + " characters";
}

function copyNoteId() {
   let noteId = document.querySelector(".note-id");
   copy(noteId.textContent, "note id");
}

function showDeletedNotes() {
   getDeletedNotes();
   deletedNotes.forEach(element => {
      let noteEl = document.createElement("div");
      noteEl.innerHTML = `
      <div class="m-2 px-6 py-4 rounded-xl bg-greyplus-darkwhite dark:bg-greyplus-tar">
         <h4 class="m-0 p-0 text-2xl">${element.name}</h4>
         <p class="text-lg">${element.content}</p>
         <p>last edited ${new Date(element.datesEdited[element.datesEdited.length - 1]).toLocaleString()}</p>
      </div>
      `;
      document.querySelector(".deletednotes").appendChild(noteEl);
   });
}

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ({ matches }) => {
   if (matches) {
      // changed to dark mode
      let metaThemeColor = document.querySelector("meta[name=theme-color]");
      metaThemeColor.setAttribute("content", "#be123c");
   } else {
      // changed to light mode
      let metaThemeColor = document.querySelector("meta[name=theme-color]");
      metaThemeColor.setAttribute("content", "#fecdd3");
   }
});

// Theme is dark by default
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
   let metaThemeColor = document.querySelector("meta[name=theme-color]");
   metaThemeColor.setAttribute("content", "#be123c");
}


function openModal(modal) {
   document.querySelector(`.modal-${modal}`).classList.add("modal-open");
}

function closeModal(modal) {
   document.querySelector(`.modal-${modal}`).classList.remove("modal-open");
}

function copy(txt, alertTxt) {
   navigator.clipboard.writeText(txt).catch(() => { console.error("Error copying."); });
   notify(`Copied ${alertTxt} to clipboard!`)
}

function notify(txt) {
   let alert = document.createElement("DIV");
   alert.textContent = txt;
   alert.classList.add("tempAlert");
   document.body.appendChild(alert);
   setTimeout(() => {
      alert.style.opacity = "1";
      alert.style.bottom = ".5rem";
   }, 200);
   setTimeout(() => {
      alert.style.opacity = "0";
      alert.style.bottom = "-10rem";
   }, 4200);
   setTimeout(() => {
      alert.remove();
   }, 4400);
}
