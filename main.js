
var url_params = new URLSearchParams((new URL(window.location.href)).search)

var trimUndesiredFields = function(obj) {
  if (obj && obj.constructor === Object) {
    var output = {}
    for (var k in obj) {
      if (k.length == 0 || k[0] != '$') {
        output[k] = trimUndesiredFields(obj[k])
      }
    }
    return output
  } else if (obj instanceof Array) {
    var output = []
    for (var k in obj) {
      output.push(trimUndesiredFields(obj[k]))
    }
    return output
  } else {
    return obj
  }
}

var store_key = "freshmart_"

function getter(key) {
  key = store_key + key
  if (localStorage[key] === undefined) {
    return null
  } else {
    return JSON.parse(localStorage[key])
  }
}

function setter(key, value) {
  key = store_key + key
  if (value) {
    localStorage[key] = JSON.stringify(trimUndesiredFields(value))
  } else {
    console.error("Invalid data stored")
  }
}

function load() {
  return getter("main")
}

function store(data) {
  setter("main", data)
}

function clear(key) {
  key = key || "main"
  localStorage.removeItem(store_key + key)
}

var session = getter("session") || {}

var clear_session = function() {
  clear("session")
  session = {}
}

var api = function(http, api_url, input, callback) {
  input = input || {}
  input.session = session
  return http({
    method: "POST",
    url: api_url,
    headers: {'Content-Type': 'application/json'},
    data: input}).then(callback ? function(d) {
        session = d.data.session || session;
        setter("session", session)
        callback(d.data.data)
      } : callback);
}

var Is_login=function(){
  if(("login_key" in session) && ("id" in session["login_key"])){
    return true
  }
  else{
    return false
  }
}

var getLoginId=function(){
  if(("login_key" in session) && ("id" in session["login_key"])){
    return session["login_key"]["id"]
  }
  else{
    return 0
  }
}

// jo bi is vakt login h uska role btayega ye fuction. 
// agr abi farmer login h to output FARMER ayega.
var Login_Role=function(){
  if(("login_key" in session) && ("role" in session["login_key"])){
    return session["login_key"]["role"]
  }
  else{
    return null
  }
}

var app = angular.module('myApp', [])

app.controller('common_ctrl', function($scope, $timeout) {
  // $scope.page_loading = true
  var cleanup=function(){
    var cleanup_list=[]
    for (i in $scope.messages){
      if ((new Date().getTime()) < $scope.messages[i]["deadline"]){

        cleanup_list.push($scope.messages[i])
      }
    }
    $scope.messages=cleanup_list
  }
  $scope.messages=[]
  $scope.my_alert = function(y, timeout) {
    timeout = timeout || 4000  // ms.
    $scope.messages.push({"message":y, "deadline": new Date().getTime() + timeout})
    $timeout(cleanup, timeout)
  }

})



app.controller('ctrl_header', function($scope) {
  $scope.profile_name = Is_login() ? session.login_key.name : "Not login"
  $scope.is_login = Is_login()
  $scope.role = Login_Role()
  $scope.login_id= Is_login() ? session.login_key.id : 0
  $scope.header = $scope
  $scope.logout = function() {
    clear_session()
    window.location.href = "index.html"
  }

  var url_params = new URLSearchParams((new URL(window.location.href)).search)
  $scope.sort_by = url_params.get("sort_by") || "SORT_BY_RELEVENCE"
  $scope.search_key = url_params.get("search_key") || ""
  $scope.menu_date = url_params.get("menu_date") || ""
  $scope.veg_nonveg = url_params.get("veg_nonveg") || "VEG_AND_NONVEG"
  $scope.search=function(){
    window.location.href = "all_dishes_page.html?search_key=" + $scope.search_key + "&sort_by=" + $scope.sort_by + "&menu_date=" + $scope.menu_date + "&veg_nonveg=" + $scope.veg_nonveg
  }

  $scope.open_menu=false

  $scope.menu_close_open=function(){
    $scope.open_menu =!$scope.open_menu
  }

})

app.controller('post_Ctrl', function($scope,$http) {
  // $scope.self = $scope
  s = $scope

  $scope.rough_list=["raghuna jhkhk ", "ghjgjh jbb", "hghgr tr dfdf", ]

  
  $scope.comment_now=function(post_info){
    $scope.is_post_info_disabled=true
    api($http, '/comment', { "comment_text":post_info.comment_text, "post_id":post_info.id}, function(backend_output){
      $scope.is_post_info_disabled=false
      post_info.all_comment_list=backend_output.comment_list
      post_info.num_comments= post_info.all_comment_list.length
      $scope.my_alert("successful")
      post_info.comment_text="" 
    })
  }
  
  $scope.show_all_comments=function(post_info){

    api($http, '/show_all_comments', { "post_id":post_info.id}, function(backend_output){
      if("error" in backend_output) {
        $scope.my_alert(backend_output.error)
      }
      else{
        post_info.all_comment_list=backend_output.comment_list
      }
  
    })
    
  }

  $scope.liked_post=function(post_info){
    api($http, '/liked_post', {"post_id":post_info.id, "is_self_like": post_info.is_self_like}, function(backend_output){
      if (post_info.is_self_like ==1){
        post_info.is_self_like -= 1
        post_info.num_post_likes_user -=1
      }
      else{
        post_info.is_self_like += 1
        post_info.num_post_likes_user +=1
      }
    })  
  }

  $scope.disliked_post=function(post_info){
    api($http, '/disliked_post', {"post_id":post_info.id, "is_self_dislike": post_info.is_self_dislike}, function(backend_output){
      if (post_info.is_self_dislike ==1){
        post_info.is_self_dislike -= 1
        post_info.num_post_dislikes_user -=1
      }
      else{
        post_info.is_self_dislike += 1
        post_info.num_post_dislikes_user +=1
      }
    })  
  }

  $scope.post_menu=function(post_info){
    post_info.menu_open= !post_info.menu_open
  }

  $scope.post_edit=function(post_info){
    post_info.editing= !post_info.editing
    post_info.menu_open=false
  }

  $scope.post_update=function(post_info){
    api($http, '/post_update',{"post_text":post_info.post_text, "post_id":post_info.id}, function(backend_output){
      post_info.editing= false 
    });
  }

  

  

});