// スケルトン
skeleton = $('#skeleton');

// 最小・最大幅
initialMinHeight = parseInt(skeleton.css('min-height'));
initialMaxHeight = $(window).height();
initialMinWidth  = parseInt(skeleton.css('min-width'));
initialMaxWidth  = $(window).width();
headingHeight    = skeleton.find('.panel-heading').outerHeight(true);
headingWidth     = skeleton.find('.panel-heading').outerWidth(true);

// UUID生成器
// https://gist.github.com/jcxplorer/823878
function generateUUID() {
  var uuid = "", i, random;
  for (i = 0; i < 32; i++) {
    random = Math.random() * 16 | 0;

    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += "-"
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
};

function initialize(title, content, height) {
  // 固有のID
  var uuid = generateUUID();

  // スケルトンから生成
  var entity = skeleton.clone().attr("id", uuid);
  entity.appendTo('main');

  // タイトルを日付に変更
  entity.find('.panel-title > .h5').text(title);

  // 初期値
  entity.find('.editor').text(content);
  entity.find('.rendered-markdown').html(marked(content || ''));

  // リサイズ・ドラッグの設定
  entity.resizable({
    minHeight:  initialMinHeight,
    minWidth:   initialMinWidth
  });
  entity.draggable({
    stack: 'div'
  });

  // 全体の高さ
  entity.css({
    'max-height': initialMaxHeight,
    'max-width':  initialMaxWidth
  });

  // .panel-bodyの高さ
  if (typeof height === 'undefined') {
    // 新規作成時
    entity.find('.panel-body').height(initialMinHeight - headingHeight);
  } else {
    // 既存のをロード時
    entity.find('.panel-body').height(height - headingHeight - 6);
  }

  // dragイベントを検知して、.panel-bodyの高さ・幅を変える
  $(entity).on('resize', function(e, ui) {
    $(entity).find('.panel-body').height(ui.size.height - headingHeight - 6);
  });

  // 移動したら位置を保存する
  $(entity).on('dragstop resizestop', function() {
    save();
  });

  // 編集ボタン押下をフック
  $('#' + uuid + ' .note-edit').on('click', function() {
    var body = $(this).parents('.note');
    ($(body).find('.editor').css('display') == 'none') ? editStart(body) : editEnd(body);
  });

  // 閉じるボタン押下をフック
  $('#' + uuid + ' .note-close').on('click', function() {
    remove($(this).parents('.note'));
  });

  return entity;
};

// LocalStorageから読み込む
function load() {
  if (localStorage.sticky) {
    var items = JSON.parse(localStorage.sticky);
    $.each(items, function(index, item) {
      initialize(item.title, item.content, parseInt(item.css.height)).css(item.css)
    });
  };
};

// 編集を開始する
function editStart(target) {
  target.find('.note-edit').addClass('on-edit');
  target.find('.rendered-markdown').css('display', 'none');
  target.find('.editor').css('display', 'block').focus();
};

// 編集を終了する
function editEnd(target) {
  var content = $(target).find('.editor').val();
  target.find('.note-edit').removeClass('on-edit');
  target.find('.rendered-markdown').html(marked(content));
  target.find('.rendered-markdown').css('display', 'block');
  target.find('.editor').css('display', 'none');
  save();
};

// 削除する
function remove(target) {
  target.remove();
  save();
};

// すべて削除する
function allRemove() {
  $('main .note').each(function() {
    remove($(this));
  });
};

// 整列させる
function tidyUp() {
  $('main .note').each(function(i, item) {
    var margin = (i + 1) * headingHeight;
    $(item).css({
      'left': margin,
      'top': margin,
      'z-index': i
    });
  });
  save();
};

// LocalStorageへ保存
function save() {
  var items = [];

  $('main .note').each(function() {
    items.push({
      title: $(this).find('.panel-title > .h5').text(),
      content: $(this).find('.editor').val(),
      css: {
        'left':   $(this).css('left'),
        'top':    $(this).css('top'),
        'height': $(this).outerHeight(),
        'width':  $(this).outerWidth()
      }
    });
  });

  localStorage.sticky = JSON.stringify(items);
};

function stickyFactory(x, y) {
  var title = moment().format('YYYY-MM-DD HH:mm:ss');
  var entity = initialize(title);

  entity.css({'left': x, 'top': y});
  editStart(entity);

  save();
};

$(function() {
  // ページロード時、LocalStorageから既存のデータを読み込み
  load();

  // 右クリックで新規作成
  $('html').contextmenu(function(e) {
    stickyFactory(
      (e.clientX - (initialMinWidth / 2)),
      (e.clientY - (headingHeight / 2))
    );
    return false;
  });

  // Shift + Nでも作成できるようにする
  $(window).keydown(function(e) {
    if ($(':focus').length === 0 && e.shiftKey && e.keyCode === 78) {
      stickyFactory(
        (initialMaxWidth / 2 - initialMinWidth / 2),
        (initialMaxHeight / 2 - initialMinHeight / 2)
      );
      return false;
    };
  });
});
