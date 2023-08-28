// Auto bracket completion
if (!settings.autocomplete.parentheses) document.querySelector("#autocomplete-parentheses").checked = false;
if (!settings.autocomplete.brackets) document.querySelector("#autocomplete-brackets").checked = false;
if (!settings.autocomplete.braces) document.querySelector("#autocomplete-braces").checked = false;

function autobracketToggled(type) {
   settings.autocomplete[type] = !settings.autocomplete[type];
   saveSettings();
}

// Font family
document.querySelector(":root").style.setProperty("--font-family", settings.font);

function changeFont(font) {
   document.querySelector(":root").style.setProperty("--font-family", font);
   settings.font = font;
   saveSettings();
}

// Word count
if (!settings.wordCount) {
   document.querySelector("#wordcount").checked = false;
   document.querySelector('.wordcount').style.display = "none";
}

function wordCountToggled() {
   if (document.querySelector(".wordcount").style.display == "none") {
      document.querySelector(".wordcount").style.display = "block";
      settings.wordCount = true;
   }
   else {
      document.querySelector(".wordcount").style.display = "none";
      settings.wordCount = false;
   }
   saveSettings();
}