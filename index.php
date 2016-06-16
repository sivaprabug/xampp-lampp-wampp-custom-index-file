<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<head>
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <meta http-equiv="Content-type" content="text/html; charset=utf-8">
    <title>Sivaprabu Machine</title>
    <link rel="stylesheet" href="zcss/style.css" type="text/css" media="screen" charset="utf-8">
    <script src="zjs/filter.js" type="text/javascript" charset="utf-8"></script>
    <script src="zjs/application.js" type="text/javascript" charset="utf-8"></script>
</head>

<body bgcolor="#FF0000" id="index">
    <div id="pagewrap">
        <div id="search">
            <label for="filter">search</label>
            <input type="text" name="filter" value="" id="filter" />
        </div>
        <div id="body">
            <table cellpadding="0" cellspacing="0" id="resultTable">
                <thead>
                    <tr class="head_tr">
                        <th title="Sorting by Name">&uarr; &darr; </th>
                    </tr>
                </thead>
                <tbody>
                    <?php
if ($handle = opendir('.')) {
    while (false !== ($file = readdir($handle))) {
if ($file != "." && $file != ".."&& $file != "zcss"&& $file != "zjs"&& $file != "index.php"&& $file != ".htaccess") {
            echo "<tr><td><a href=\" $file\"><div class='sub'>$file</div></a></td></tr>";
        }
    }
    closedir($handle);
}
?>
                </tbody>
            </table>
        </div>
    </div>
</body>

</html>
