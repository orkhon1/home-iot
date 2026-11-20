// Add this handler inside the existing doPost(e):
// if (e.parameter.action === "setOledMessage") return saveOledMessage(e);
//
// Before returning the existing doGet JSON, where data is the response object:
// data.lcdMsg = readOledMessage(data.lcdMsg);

function saveOledMessage(e) {
  const message = (e.parameter.lcdMsg || "").trim();
  const valid = message.length > 0 && message.length <= 120;

  if (valid) {
    PropertiesService.getScriptProperties().setProperty("oledMessage", message);
  }

  return ContentService
    .createTextOutput(JSON.stringify(valid ? {ok: true, lcdMsg: message} : {ok: false}))
    .setMimeType(ContentService.MimeType.JSON);
}

function readOledMessage(fallback) {
  const message = PropertiesService.getScriptProperties().getProperty("oledMessage");
  return message === null ? fallback : message;
}
