if (typeof Cc == "undefined") {
  var Cc = Components.classes;
}
if (typeof Ci == "undefined") {
  var Ci = Components.interfaces;
}

var promptAgain = true;
window.addEventListener("load", initOverlay, false);

function initOverlay() {
var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
this.prefsb = prefs.getBranch("extensions.emptyfolder.");
promptAgain = prefsb.getBoolPref("promptAgain");
document.getElementById("folderPaneContext")
	.addEventListener("popupshowing",
		function(e) {
			contextPopupShowing(e);
		}, false);
}

function contextPopupShowing(event) {
	var selectedFolder = gFolderTreeView.getSelectedFolders()[0];
	if(!selectedFolder.isServer && !isIgnoredFolder(selectedFolder)) { 
	    document.getElementById("emptyfolder").hidden = 0;
    } else {
		document.getElementById("emptyfolder").hidden = 1;
	}
}

function isIgnoredFolder(aFolder) {
	return (aFolder.getFlag(nsMsgFolderFlags.Trash) || aFolder.getFlag(nsMsgFolderFlags.Junk) || aFolder.getFlag(nsMsgFolderFlags.Archive));
}

function emptyFolder() {
	var selectedFolder = gFolderTreeView.getSelectedFolders()[0];
	getMessagesToDelete(selectedFolder);
}

function getMessagesToDelete(aFolder) {
	let database = aFolder.msgDatabase;
	var msgs_to_delete = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
	
	for each (let msgHdr in fixIterator(database.EnumerateMessages(), Ci.nsIMsgDBHdr)) {
		let title = msgHdr.mime2DecodedSubject;
		msgs_to_delete.appendElement(msgHdr,false);
	}
  
	if(promptAgain) {
		confirmDelete(msgs_to_delete, aFolder);
	} else {
		performDelete(msgs_to_delete, aFolder);
	}
	aFolder.msgDatabase = null;
}

function confirmDelete(msgs_to_delete, aFolder) {
	var stringsBundle = document.getElementById("string-bundle");
	var checkbox = {value:false};
	var prompt_service = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
	var confirmation = prompt_service.confirmEx(window,
	   stringsBundle.getString('empty') + " " + aFolder.prettiestName + " " + stringsBundle.getString('foldercap'),
	   stringsBundle.getString('sure')  + " " + aFolder.prettiestName + " "+ stringsBundle.getString('folder'),
	   prompt_service.STD_YES_NO_BUTTONS,
	   null, null, null,
	   stringsBundle.getString('neveragain'),
	   checkbox) == 0;
	if (checkbox.value) {
		prefsb.setBoolPref("promptAgain", true);
	}
	if(confirmation) {
		performDelete(msgs_to_delete, aFolder);
	}
}

function performDelete(msgs_to_delete, aFolder) {
	if (msgs_to_delete.length) {
		aFolder.deleteMessages(msgs_to_delete, msgWindow, false, true, null, true);
	}
}