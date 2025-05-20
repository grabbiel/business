document.addEventListener("DOMContentLoaded", function () {
  // Add click event to download the PDF
  const resumeDownload = document.getElementById("resume-download");

  resumeDownload.addEventListener("click", function () {
    const pdfSrc = document
      .querySelector("#resume object")
      .getAttribute("data");
    const link = document.createElement("a");
    link.href = pdfSrc;
    link.download = "resume.pdf"; // Set the download filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});
