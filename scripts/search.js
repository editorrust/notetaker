let searchbar = document.querySelector(".searchbar");
let resultsMenu = document.querySelector(".search-menu");
let searchbarParent = document.querySelector(".searchbar-parent");

searchbar.addEventListener("focus", (e) => {
   searchbarParent.style.position = "absolute";
   searchbarParent.style.zIndex = "1220";
   searchbarParent.style.width = "30%";
   searchbarParent.style.top = "-.1em";

   resultsMenu.style.opacity = 1;
   resultsMenu.style.pointerEvents = "auto";
   genList(notes);
});

searchbar.addEventListener("blur", (e) => {
   searchbarParent.style.position = "static";
   searchbarParent.style.width = "100%";
   searchbarParent.style.top = "0";

   searchbar.value = "";

   setTimeout(() => {
      resultsMenu.style.opacity = 0;
      resultsMenu.style.pointerEvents = "none";
   }, 100);
});

function search(event) {
   if (event.key == "Backspace") genList(notes);
   else {
      regenTitleContent();
      regenDescContent();
   }
   let searchInput = settings.search.caseSensitive ? searchbar.value : searchbar.value.toLowerCase();
   resultsMenu.querySelectorAll(".note-list-item").forEach((el) => {
      const userInput = searchInput;
      let title = el.querySelector(".list-item-name");
      let desc = el.querySelector(".list-item-content");
      let foundMatch = {
         title: false,
         desc: false
      }

      highlightTitleMatches();
      highlightDescMatches();

      function highlightTitleMatches() {
         const contentElement = title;
         const lines = contentElement.textContent.split('\n');
         let modifiedHTML = contentElement.innerHTML;

         const regexPattern = new RegExp(userInput, `${settings.search.caseSensitive ? "" : "i"}g`); // 'i' for case-insensitive, 'g' for global search

         let matches;
         for (const line of lines) {
            matches = line.match(regexPattern);
         }
         if (!matches) return;

         foundMatch.title = true;
         for (const match of matches) {
            const highlightedMatch = `<mark>${match}</mark>`;
            modifiedHTML = modifiedHTML.replace(match, highlightedMatch);
         }

         title.innerHTML = modifiedHTML;
      }
      function highlightDescMatches() {
         const contentElement = desc;
         const lines = contentElement.innerHTML.replace(/<div>/g, "").replace(/<br>/g, "\n").replace(/<\/div>/g, "\n").split('\n');

         const regexPattern = new RegExp(userInput, `${settings.search.caseSensitive ? "" : "i"}g`); // 'i' for case-insensitive, 'g' for global search

         let savedLines = [];

         lines.forEach((line, i, arr) => {
            let lastLine = arr[i - 1] || "";
            let nextLine = arr[i + 1] || "";


            const matches = line.match(regexPattern) || [];
            if (matches.length > 0) {
               savedLines.push(lastLine);
               foundMatch.desc = true;
            }
            let editedLine = line;
            for (const match of matches) {
               const highlightedMatch = `<mark>${match}</mark>`;

               editedLine = editedLine.replace(match, highlightedMatch);
            }
            if (matches.length > 0) {
               savedLines.push(editedLine);
               savedLines.push(nextLine);
            }
         });

         desc.innerHTML = "";
         savedLines.forEach(line => {
            let newEl = document.createElement("span");
            newEl.innerHTML = line;
            desc.append(newEl);
         });
      }

      if (foundMatch.title || foundMatch.desc) return;
      el.remove();
   });
}

function genList(notes) {
   notes.sort((noteA, noteB) => {
      return new Date(noteA.datesEdited[noteA.datesEdited.length - 1]) - new Date(noteB.datesEdited[noteB.datesEdited.length - 1]);
   });

   document.querySelector(".search-menu").innerHTML = "";
   notes.forEach(note => {
      resultsMenu.append(newListNote(note));
   });


   function newListNote(note) {
      let noteEl = document.createElement("div");
      let name = document.createElement("h2");
      let text = document.createElement("p");
      let lastEdit = document.createElement("p");
   
      name.classList.add("list-item-name");
      text.classList.add("list-item-content");
      lastEdit.classList.add("list-item-last-edit");
   
      noteEl.classList.add("note-list-item");
      noteEl.id = "id-search-" + note.id;
   
      noteEl.onclick = () => { openNote(note.id); }
   
      name.innerHTML = note.name;
      text.innerHTML = note.content;
      lastEdit.textContent = note.datesEdited.length == 0 ? "never" : dateIs(note.datesEdited[note.datesEdited.length - 1], "quick");
   
      noteEl.append(name);
      noteEl.append(text);
      noteEl.append(lastEdit);
      return noteEl;
   }
}

function regenTitleContent() {
   notes.forEach(note => {
      editTitle(note);
   });

   function editTitle(note) {
      let noteEl = document.querySelector("#id-search-" + note.id);
      if (!noteEl) return;

      let title = noteEl.querySelector(".list-item-name");
      title.innerHTML = note.name;
   }
}

function regenDescContent() {
   notes.forEach(note => {
      editDesc(note);
   });

   function editDesc(note) {
      let noteEl = document.querySelector("#id-search-" + note.id);
      if (!noteEl) return;

      let desc = noteEl.querySelector(".list-item-content");
      desc.innerHTML = note.content;
   }
}