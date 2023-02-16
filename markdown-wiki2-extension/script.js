var url = "https://example.com";
var categoriesList = [];

console.log("x1");

function createSelectOptions(categories) {
    for (var i in categories) {
        var c = categories[i];
        console.log(c);
        $("#category-selector").append(`<option value="${c.value}">${c.label}</option>`);
    }   
}


$.get(url + "/api/categories/list")
.then(function(data) {
    console.log(data);
    if (data.status == "OK") {
        var categories = data.data;
        var categories_to_add = [];
        for (var i in categories) {
          var menuItem = categories[i];
          if (menuItem.parent_id == 1) {
            var obj = {label: menuItem.name, value: menuItem.id};
            categories_to_add.push(obj);
            for (var j in categories) {
              var menuItem2 = categories[j];
              if (menuItem2.parent_id == obj.value) {
                var obj2 = {label: ">>> " + menuItem2.name, value: menuItem2.id};
                categories_to_add.push(obj2);
                for (var k in categories) {
                  var menuItem3 = categories[k];
                  if (menuItem3.parent_id == obj2.value) {
                    var obj3 = {label: ">>> >>> " + menuItem3.name, value: menuItem3.id};
                    categories_to_add.push(obj3);
                  }
                }
              }
            }
          }
        }
        categoriesList = categories_to_add;
        createSelectOptions(categoriesList);
        console.log(categoriesList);
    }
    else {
        console.log(data.error);
    }
})
.fail(function(err) {
    console.log(err);
});


$("#category-selector").on("change", function(e) {
    console.log("x1");
    chrome.runtime.sendMessage({category_id: e.target.value}, function(response) {
        console.log(response.status);
    }); 
});

chrome.runtime.sendMessage({greeting: "hello"}, function(response) {
    console.log(response.farewell);
});