/* Preserve third-stage bookmarks; selection migration runs in the shared planner. */
(function(){
  const query=new URLSearchParams(location.search);query.set('view','edit');query.set('step','1');
  location.replace('/explore/yunnan/planner/?'+query);
})();
