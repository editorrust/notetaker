function renderMarkdown() {
   let code = parseMarkdown(document.querySelector(".note-content").innerHTML);
   document.querySelector(".rendered-markdown").innerHTML = code;
   let wordCount = getWordCount(document.querySelector(".note-content"));
   document.querySelector(".wordcount").textContent = wordCount;
}

function parseMarkdown(text) {
   // clean html
   let result = text;
   // removing divs and formmating new lines
   result = result.replace(/<div>/g, "");
   result = result.replace(/<br>/g, "");
   result = result.replace(/<\/div>/g, "\n");
   // links to other notes
   result = result.replace(/\[\[(.*?)\]\]/g, (match, inner) => {
      let noteid = inner.replace(/<\/span>/g, "").replace(/<span(.*?)>/g, "");
      return `<span class='underline text-orange-500' id='id-${noteid}' onclick='tryOpenNote("${noteid}")' title='${noteid}'>${getNoteName(noteid)}</span>`;
   });
   // blockquote
   result = result.replace(/(?:&gt;[\s\S]*?\n)+/gm, (fullMatch) => {
      let blockquote = fullMatch.trim().replace(/&gt;/g, "");
      return "<blockquote>" + blockquote + "</blockquote>";
   });
   // checklists
   result = result.replace(/(\n\s*(-|\[x\]|\[.\])\s.*)+/g, (fullMatch) => {
      let items = "";
      fullMatch.trim().split('\n').forEach( item => {
         let checked = (item[2] === "[" && item[3] === "x") ? "checked" : "unchecked";
         // console.log(checked, item[3])

         let id = crypto.randomUUID();
         items += `<li data-state="${checked}" onclick="changeClickState()" classlist="${checked ? "done" : ""}"><input id="id-${id}" type="checkbox"/><label for="${id}" class="tick"></label><span>${item.substring(item.indexOf("]") + 1)}</span></li>`;
      });
      return "<ul style='list-style-type: none'>" + items + "</ul>";
   });
   // lists (unordered) - see citation
   result = result.replace(/(\n\s*(\-|\+)\s.*)+/g, (fullMatch) => {
      let items = "";
      fullMatch.trim().split('\n').forEach( item => { items += "<li>" + item.substring(2) + "</li>"; } );
      return "<ul>" + items + "</ul>";
   });
   // lists (ordered)
   result = result.replace(/(\n\s*(\d+\.)\s.*)+/g, (fullMatch) => {
      let items = "";
      fullMatch.trim().split('\n').forEach( item => { items += "<li>" + item.substring(3) + "</li>"; } );
      return "<ol>" + items + "</ol>";
   });
   // identify code lines
   result = result.replace(/`([^\`].*?)`/g, "<code class='inline-code'>$1</code>");
   // replace \n with <br>
   result = result.replace(/\n/g, "<br>");
   // replace &nbsp; with spaces
   result = result.replace(/&nbsp;/g, " ");
   // identify double spaces
   result = result.replace(/\s\s/g, "<br>");
   // identify code blocks
   result = result.replace(/```<br>(.*?)```/g, "<code>$1</code>");
   // bold
   result = result.replace(/\*\*([^\*]+)\*\*/g, "<b>$1</b>");
   // italics
   result = result.replace(/\*([^\*]+)\*/g, "<i>$1</i>");
   // highlight
   result = result.replace(/\==(.*?)==/gm, "<mark>$1</mark>");
   // comment
   result = result.replace(/%%(.*?)%%/gm, "");
   // superscript
   result = result.replace(/\^(.*?)\^/gm, "<sup>$1</sup>");
   // strikethrough
   result = result.replace(/\~~(.*?)~~/gm, "<s>$1</s>");
   // subscript
   result = result.replace(/\~(.*?)~/gm, "<sub>$1</sub>");
   // images
   result = result.replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' title='$1'>");
   // links
   result = result.replace(/\[(.*?)\]\((.*?)\)/g, "<a class='underline text-blue-700' href='$2' title='$2'>$1</a>");
   // headers
   result = result.replace(/###### (.*?)(?:<br>|$)/gm, "<h6>$1</h6>");
   result = result.replace(/##### (.*?)(?:<br>|$)/gm, "<h5>$1</h5>");
   result = result.replace(/#### (.*?)(?:<br>|$)/gm, "<h4>$1</h4>");
   result = result.replace(/### (.*?)(?:<br>|$)/gm, "<h3>$1</h3>");
   result = result.replace(/## (.*?)(?:<br>|$)/gm, "<h2>$1</h2>");
   result = result.replace(/# (.*?)(?:<br>|$)/gm, "<h1>$1</h1>");
   // horizontal rule
   result = result.replace(/---/g, "<hr>");

   return result;
}

function changeClickState() {
   if (event.target.classList.contains("tick")) {
      const key = event.target.dataset.state;

      if (key !== "unchecked") {
         event.target.dataset.state = "unchecked";
         event.target.parentElement.classList.remove("done");
      }
      else {
         event.target.dataset.state = "checked";
         event.target.parentElement.classList.add("done");
      }
   }
};