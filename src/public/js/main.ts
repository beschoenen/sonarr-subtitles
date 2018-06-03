$(function () {
  // Set origin in info text
  $("span.host").text(document.location.origin);

  // Manual search
  $(document).on("click", "i.search.fa-search", function (event: Event) {
    callAPI(event, `${document.location.origin}/queue/${$(this).data("id")}/search`, "fa-search");
  });

  // Delete item
  $(document).on("click", "i.delete.fa-trash", function (event: Event) {
    if (!confirm("Do you really want to delete this item?")) return;

    callAPI(event, `${document.location.origin}/queue/${$(this).data("id")}/remove`, "fa-trash");
  });
});

function callAPI(event: Event, url: string, icon: string) {
  $(event.target).removeClass(icon).addClass("fa-spin fa-spinner");

  $.post(url, function (result) {
    $(event.target).removeClass("fa-spin fa-spinner");

    if (result.success) {
      $(event.target).addClass("fa-check").delay(5000).queue(function () {
        $(this).closest("tr").fadeOut(300, () => $(this).remove());
      });
    } else {
      $(event.target).addClass("fa-times").delay(5000).queue(function () {
        $(this).addClass(icon).removeClass("fa-times");
      });
    }
  });
}
