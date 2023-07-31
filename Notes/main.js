// Some code has been taken from code clippets

// =========================================
// Save
// =========================================

let notes = [];
let deletedNotes = [];

if (localStorage.getItem("thisofficenotes")) {
   notes = JSON.parse(localStorage.getItem("thisofficenotes"));
} else notes = [];

let save = setInterval(() => {
   localStorage.setItem("thisofficenotes", JSON.stringify(notes));
}, 500);


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
      reloadNoteList();
      displayNote(notes[notes.length - 1].id);
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

showLatestNote();


// =========================================
// Create and edit
// =========================================

function newNote() {
   event.preventDefault();

   let form = document.querySelector(".new-note");
   let name = form.name.value;
   let text = form.content.value;
   form.name.value = "";
   form.content.value = "";
   let id = uid();

   let edits = [new Date()];

   let note = {
      id: id,
      name: name,
      text: text,
      edits: edits
   }
   
   notes.push(note);
   displayNote(id);
   addNoteToList(note);
   
   closeModal("newnote");
}

function deleteNote(id) {
   let noteIndex = notes.findIndex(note => note.id == id);
   let deletedNote = notes.splice(noteIndex, 1);
   getDeletedNotes();
   deletedNotes.push(deletedNote);
   setDeletedNotes();
   showLatestNote();
}


// =========================================
// Updating and displaying
// =========================================

function reloadNoteList() {
   notes.sort((noteA, noteB) => {
      return new Date(noteA.edits[noteA.edits.length - 1]) - new Date(noteB.edits[noteB.edits.length - 1]);
   });

   notes.forEach(note => {
      addNoteToList(note);
   });
}

function addNoteToList(note) {
   let noteEl = document.createElement("div");
   let name = document.createElement("h2");
   let text = document.createElement("p");
   let lastEdit = document.createElement("p");
   
   name.classList.add("list-item-name");
   text.classList.add("list-item-text");
      
   noteEl.classList.add("note-list-item");
   noteEl.id = "id-" + note.id;
      
   noteEl.onclick = () => { displayNote(note.id); }

   name.innerHTML = note.name;
   text.innerHTML = note.text.length < 50 ? note.text : note.text.slice(0, 50) + "...";
   lastEdit.textContent = dateIs(note.edits[note.edits.length - 1], "quick");
      
   noteEl.append(name);
   noteEl.append(text);
   noteEl.append(lastEdit);
   document.querySelector(".note-list").prepend(noteEl);
}

function displayNote(id) {
   let note = notes.find(note => note.id == id);
   let noteIndex = notes.findIndex(note => note.id == id);
   
   let noteName =  document.querySelector(".note-name");
   let noteText = document.querySelector(".note-text");

   noteName.innerHTML = note.name;
   noteText.innerHTML = note.text
   document.querySelector(".note-last-edit").textContent = "last edit at " + timeIs(new Date(note.edits[note.edits.length - 1])) + " on " + dateIs(new Date(note.edits[note.edits.length - 1]), "quick");
   
   document.querySelector(".delete-note").onclick = () => { deleteNote(note.id); }
   
   renderMarkdown();
   
   let nameListener;
   let textListener;
   
   noteName.onfocus = () => {
      nameListener = setInterval(checkForChange(noteName, "name"), 2000);
   }
   noteText.onfocus = () => {
      textListener = setInterval(checkForChange(noteText, "text"), 2000);
   }
   
   noteName.onblur = () => {
      clearInterval(nameListener);
      checkForChange(noteName, "name");
   }
   noteText.onblur = () => {
      clearInterval(textListener);
      checkForChange(noteText, "text");
   }
   
   function checkForChange(element, data) {
      if (element.textContent != note[data]) {
         let now = new Date();

         notes[noteIndex][data] = element.innerHTML;
         notes[noteIndex].edits.push(now);
         
         let listItem = document.querySelector("#id-" + notes[noteIndex]["id"]);
         listItem.querySelector(".list-item-" + data).innerHTML = note.text.length < 50 ? note.text : note.text.slice(0, 50) + "...";
         
         document.querySelector(".note-last-edit").textContent = "last edit at " + timeIs(now) + " on " + dateIs(now, "quick");
      }
   }
}


// =========================================
// Markdown formatting
// =========================================

document.querySelector(".note-text").addEventListener("keyup", () => {
   renderMarkdown();
});

function renderMarkdown() {
   let code = parseMarkdown(document.querySelector(".note-text").innerHTML);
   document.querySelector(".rendered-markdown").innerHTML = code;
   let wordCount = getWordCount(document.querySelector(".note-text"));
   document.querySelector(".wordcount").textContent = wordCount;
}

function parseMarkdown(text) {
   // clean html
   let result = text;
   // removing divs and formmating new lines
   result = result.replace(/<div>/g, "");
   result = result.replace(/<br>/g, "");
   result = result.replace(/<\/div>/g, "<br>");
   // bold
   result = result.replace(/\*\*([^\*]+)\*\*/g, "<b>$1</b>");
   // italics
   result = result.replace(/\*([^\*]+)\*/g, "<i>$1</i>");
   // highlight
   result = result.replace(/\==(.*?)==/gm, "<mark>$1</mark>");
   // superscript
   result = result.replace(/\^(.*?)\^/gm, "<sup>$1</sup>");
   // strikethrough
   result = result.replace(/\~~(.*?)~~/gm, "<s>$1</s>");
   // subscript
   result = result.replace(/\~(.*?)~/gm, "<sub>$1</sub>");
   // headers
   result = result.replace(/###### (.*?)(?:<br>|$)/gm, "<h6>$1</h6>");
   result = result.replace(/##### (.*?)(?:<br>|$)/gm, "<h5>$1</h5>");
   result = result.replace(/#### (.*?)(?:<br>|$)/gm, "<h4>$1</h4>");
   result = result.replace(/### (.*?)(?:<br>|$)/gm, "<h3>$1</h3>");
   result = result.replace(/## (.*?)(?:<br>|$)/gm, "<h2>$1</h2>");
   result = result.replace(/# (.*?)(?:<br>|$)/gm, "<h1>$1</h1>");

   return result;
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

function changeFont(font) {
   document.documentElement.style.setProperty("font-family", font);
}