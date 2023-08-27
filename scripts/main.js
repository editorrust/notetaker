let notebooks = [];
let notes = [];
let initSettings = {
   autocomplete: {
      parentheses: true,
      brackets: true,
      braces: true
   },
   activeNotebook: "not set",
   font: "serif"
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
   await getNotes(settings.activeNotebook);

   showLatestNote();
}

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

// let notes = [];
let deletedNotes = [];

// if (localStorage.getItem("thisofficenotes")) {
//    notes = JSON.parse(localStorage.getItem("thisofficenotes"));
// } else notes = [];

// let save = setInterval(() => {
//    localStorage.setItem("thisofficenotes", JSON.stringify(notes));
// }, 500);


function clearSave() {
   if (confirm("Are you sure you want to delete your save?")) {
      notes = [];
      localStorage.setItem("thisofficenotes", JSON.stringify(notes));
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
      localStorage.setItem("thisofficenotes", JSON.stringify(notes));
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
   if (localStorage.getItem("thisofficenotes-deleted")) {
      deletedNotes = JSON.parse(localStorage.getItem("thisofficenotes-deleted"));
   } else deletedNotes = [];
}

function setDeletedNotes() {
   localStorage.setItem("thisofficenotes-deleted", JSON.stringify(deletedNotes));
}


// =========================================
// Notes
// =========================================

async function newNote() {
   event.preventDefault();

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

document.querySelector(".note-content").addEventListener("keyup", () => {
   renderMarkdown();
});

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
   $.post("/note-delete", {
      notebookid: settings.activeNotebook,
      id: id,
   });

   let noteIndex = notes.findIndex(note => note.id == id);
   let deletedNote = notes.splice(noteIndex, 1);
   getDeletedNotes();
   deletedNotes.push(deletedNote);
   setDeletedNotes();
   showLatestNote();
}

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

   // Add listeners for updates
   let nameListener;
   let textListener;

   noteName.onfocus = () => {
      nameListener = setInterval(checkForChange(noteName, "name"), 2000);
   }
   noteText.onfocus = () => {
      textListener = setInterval(checkForChange(noteText, "content"), 2000);
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
      if (element.textContent != note[type]) {
         let now = new Date();

         notes[noteIndex][type] = element.innerHTML;
         notes[noteIndex].datesEdited.push(now);

         updateNote(notes[noteIndex].id, type, document.querySelector(".note-" + type).innerHTML);


         let listItem = document.querySelector("#id-" + notes[noteIndex]["id"]);
         listItem.querySelector(".list-item-" + type).innerHTML = note.content.length < 50 ? parseMarkdown(note.content).replace(/<br>/g, " ") : parseMarkdown(note.content.slice(0, 50)).replace(/<br>/g, " ") + "...";

         document.querySelector(".note-last-edit").textContent = "last edit at " + timeIs(now) + " on " + dateIs(now, "quick");
      }
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

   try {
      const response = await fetch(`/newnotebook?name=${encodeURIComponent(name)}`);
      const notebook = await response.json();
      settings.activeNotebook = notebook.id;
      saveSettings();
      getData();
   }
   catch (error) {
      console.error(error);
   }

   closeModal("newnotebook");
}

function openNotebook(id) {
   settings.activeNotebook = id;
   saveSettings();
   getData();
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

function toggleNotebookSwitcher() {
   let switcher = document.querySelector(".notebook-switcher");
   if (switcher.style.display == "block") {
      switcher.style.display = "none";
   }
   else {
      switcher.style.display = "block";
   }
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
         <li class="notebook-list-item my-1.5 py-2 px-4 rounded-md ${notebook.id == settings.activeNotebook ? "bg-greyplus-lightest dark:bg-greyplus-night" : "bg-greyplus-darkerwhite dark:bg-greyplus-darkblack"} cursor-pointer" onclick="openNotebook('${notebook.id}')">
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

   name.innerHTML = note.name;
   text.innerHTML = note.content.length < 50 ? parseMarkdown(note.content).replace(/<br>/g, " ") : parseMarkdown(note.content.slice(0, 50)).replace(/<br>/g, " ") + "...";
   lastEdit.textContent = note.datesEdited.length == 0 ? "never" : dateIs(note.datesEdited[note.datesEdited.length - 1], "quick");

   noteEl.append(name);
   noteEl.append(text);
   noteEl.append(lastEdit);
   document.querySelector(".note-list").prepend(noteEl);
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
   notify(noteId.textContent, "note id");
}

function toggleWordCount() {
   if (document.querySelector('.wordcount').style.display == 'none') {
      document.querySelector('.wordcount').style.display = 'block';
   }
   else {
      document.querySelector('.wordcount').style.display = 'none';
   }
}

function uid() {
   return crypto.randomUUID();

   // If the crypto api is not supported, it could use this
   // let id = Date.now().toString(36) + Math.random().toString(36).substr(2);
   // while (id.length < 20) id = id + "0";
   // return id;
}

function openModal(modal) {
   document.querySelector(`.modal-${modal}`).classList.add("modal-open");
}

function closeModal(modal) {
   document.querySelector(`.modal-${modal}`).classList.remove("modal-open");
}

function notify(txt, alertTxt) {
   navigator.clipboard.writeText(txt).then(() => {
       console.log("Copied!");
   }, () => { console.log("Error copying."); });
   let alert = document.createElement("DIV");
   alert.textContent = `Copied ${alertTxt}!`;
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

// Settings

if (!settings.autocomplete.parentheses) document.querySelector("#autocomplete-parentheses").checked = false;
if (!settings.autocomplete.brackets) document.querySelector("#autocomplete-brackets").checked = false;
if (!settings.autocomplete.braces) document.querySelector("#autocomplete-braces").checked = false;

document.querySelector(":root").style.setProperty("--font-family", settings.font);


function changeFont(font) {
   document.querySelector(":root").style.setProperty("--font-family", font);
   settings.font = font;
   saveSettings();
}

function autobracketToggled(type) {
   settings.autocomplete[type] = !settings.autocomplete[type];
   saveSettings();
}