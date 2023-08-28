let textPad = document.querySelector(".note-content");

textPad.addEventListener("keypress", (e) => {
   if (settings.autocomplete.parentheses && e.key === "(") {
      event.preventDefault();
      insertAtCursor("(");
      insertAtCursor(")");
      moveCursorBackOneChar();
   }
   if (settings.autocomplete.brackets && e.key === "[") {
      event.preventDefault();
      insertAtCursor("[");
      insertAtCursor("]");
      moveCursorBackOneChar();
   }
   if (settings.autocomplete.braces && e.key === "{") {
      event.preventDefault();
      insertAtCursor("{");
      insertAtCursor("}");
      moveCursorBackOneChar();
   }


   function moveCursorBackOneChar() {
      var selection = window.getSelection();

      if (selection.rangeCount > 0) {
         var range = selection.getRangeAt(0);

         range.setEnd(range.endContainer, range.endOffset - 1);

         selection.removeAllRanges();
         selection.addRange(range);
      }
   }

   if (e.key === "Enter") {
      // insertAtCursor("\n");

      let textField = textPad.innerText;
      const cursorPosition = getSelectionStartEquiv(textPad);

      // Gte last line
      let lineStartPosition = cursorPosition;
      while (lineStartPosition > 0 && textField.charAt(lineStartPosition - 1) !== '\n') {
         lineStartPosition--;
      }
      let lineEndPosition = lineStartPosition;
      while (lineEndPosition < textField.length && textField.charAt(lineEndPosition) !== '\n') {
         lineEndPosition++;
      }
      const currentLineContent = textField.substring(lineEndPosition, lineStartPosition);

      insertAtCursor("\n");
      if (currentLineContent.startsWith("- [")) insertAtCursor("- [ ] ",);
      else if (currentLineContent.startsWith("- ")) insertAtCursor("- ",);
      event.preventDefault();
   }

   function insertAtCursor(text) {
      selection = window.getSelection();

      const range = selection.getRangeAt(0);
      const newText = document.createTextNode(text);

      range.deleteContents();
      range.insertNode(newText);

      range.setStartAfter(newText);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
   }

   function getSelectionStartEquiv(element) {
      const editableDiv = element;
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && selection.anchorNode && editableDiv.contains(selection.anchorNode)) {
         const range = selection.getRangeAt(0);
         const precedingRange = document.createRange();
         precedingRange.setStart(editableDiv, 0);
         precedingRange.setEnd(range.startContainer, range.startOffset);
         const selectionStartEquivalent = precedingRange.toString().length;
         return selectionStartEquivalent;
      }
   }
});
