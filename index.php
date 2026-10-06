<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<head>
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <meta http-equiv="Content-type" content="text/html; charset=utf-8">
    <title>IP Address of Sivaprabu Ganesan</title>
    <link rel="stylesheet" href="zcss/style.css" type="text/css" media="screen" charset="utf-8">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="zjs/filter.js" type="text/javascript" charset="utf-8"></script>
    <script src="zjs/application.js" type="text/javascript" charset="utf-8"></script>
</head>

<body bgcolor="#1a1a1a" id="index">
    <div id="pagewrap">
    <div id="header">
        <h1><i class="fas fa-folder-open"></i> IP ADDRESS OF SIVAPRABU GANESAN</h1>
        <div style="display: flex; align-items: center; gap: 15px;">
            <div id="search">
                <label for="filter"><i class="fas fa-search"></i> Search files <kbd title="Press to focus search">/</kbd></label>
                <input type="text" name="filter" value="" id="filter" placeholder="Filter press / to focus" />
            </div>
            <button id="theme-toggle" class="theme-btn">
                <i class="fas fa-moon"></i> Dark Mode
            </button>
        </div>
    </div>
        <div id="body">
        <div id="loading" style="display: none; text-align: center; padding: 20px; color: #00d4aa;">
            <i class="fas fa-spinner fa-spin"></i> Loading files...
        </div>
        <table cellpadding="0" cellspacing="0" id="resultTable">
                <thead>
                    <tr class="head_tr">
                        <th><i class="fas fa-file"></i> Name</th>
                        <th><i class="fas fa-weight"></i> Size</th>
                        <th><i class="fas fa-calendar"></i> Modified</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}



$markdownFiles = [];
if ($handle = opendir(__DIR__)) {
    while (false !== ($file = readdir($handle))) {
        if ($file != "." && $file != "..") {
            $filepath = __DIR__ . '/' . $file;
            if (is_file($filepath) && strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'md' && strtolower($file) !== 'readme.md') {
                $markdownFiles[] = $file;
            }
        }
    }
    closedir($handle);
}

sort($markdownFiles, SORT_NATURAL | SORT_FLAG_CASE);

foreach ($markdownFiles as $file) {
    $filepath = __DIR__ . '/' . $file;
    $fileSize = filesize($filepath);
    $fileModified = date("Y-m-d H:i:s", filemtime($filepath));
    $sizeDisplay = formatFileSize($fileSize);
    $fileNameNoExt = htmlspecialchars(strtoupper(pathinfo($file, PATHINFO_FILENAME)), ENT_QUOTES, 'UTF-8');
    $fileUrl = 'library/render.php?file=' . rawurlencode($file);
    echo "<tr>
        <td><a href='$fileUrl'><div class='filename'>$fileNameNoExt</div></a></td>
        <td>$sizeDisplay</td>
        <td>$fileModified</td>
    </tr>";
}
?>
                </tbody>
            </table>
        </div>
    </div>
<script>
document.addEventListener('keydown', function(e) {
    var filter = document.getElementById('filter');
    if (!filter) return;
    var notTyping = document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA';
    // Press '/' to focus search (when not already typing in an input)
    if (e.key === '/' && document.activeElement !== filter && notTyping) {
        e.preventDefault();
        filter.focus();
        filter.select();
    }
    // Press 'h' to go home
    if ((e.key === 'h' || e.key === 'H') && notTyping) {
        window.location.href = '../';
    }
    // Press Escape to clear and blur search
    if (e.key === 'Escape' && document.activeElement === filter) {
        filter.value = '';
        filter.dispatchEvent(new Event('keyup'));
        filter.blur();
    }
});
</script>
<style>
kbd { display: inline-block; padding: 1px 6px; font-size: 11px; font-family: monospace; border: 1px solid #888; border-radius: 3px; background: rgba(255,255,255,0.15); color: inherit; margin-left: 4px; vertical-align: middle; }
</style>
</body>

</html>
