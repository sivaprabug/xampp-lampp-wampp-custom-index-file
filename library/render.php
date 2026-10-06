<?php
require_once __DIR__ . '/parsedown.php';

class MyParsedown extends Parsedown {
    protected function blockCodeComplete($Block) {
        return $this->wrapCode($Block);
    }

    protected function blockFencedCodeComplete($Block) {
        $class = $Block['element']['element']['attributes']['class'] ?? '';
        if ($class === 'language-mermaid') {
            $Block['element'] = array(
                'name' => 'div',
                'attributes' => array('class' => 'diagram-source'),
                'text' => $Block['element']['element']['text']
            );
            return $Block;
        }
        return $this->wrapCode($Block);
    }

    private function wrapCode($Block) {
        $class = $Block['element']['element']['attributes']['class'] ?? '';
        $language = str_replace('language-', '', $class) ?: 'text';
        $Block['element'] = array(
            'name' => 'div',
            'attributes' => array('class' => 'code-block-container', 'data-language' => $language),
            'elements' => array($Block['element'])
        );
        return $Block;
    }
}

function escapeHtml($value) {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$rootDirectory = dirname(__DIR__);
$mdFile = $_GET['file'] ?? '';
$markdown = '';
$error = '';
$status = 200;
if (!is_string($mdFile) || $mdFile === '' || basename($mdFile) !== $mdFile
        || strpos($mdFile, '\\') !== false || strtolower(pathinfo($mdFile, PATHINFO_EXTENSION)) !== 'md') {
    $status = 400;
    $error = 'Choose a Markdown document from the library to get started.';
    $mdFile = '';
} else {
    $mdPath = realpath($rootDirectory . '/' . $mdFile);
    if ($mdPath === false || dirname($mdPath) !== $rootDirectory || !is_file($mdPath) || !is_readable($mdPath)) {
        $status = 404;
        $error = 'This document could not be found. It may have been moved or renamed.';
    } else {
        $markdown = file_get_contents($mdPath);
        if ($markdown === false) {
            $status = 500;
            $error = 'This document could not be read. Please try again later.';
            $markdown = '';
        }
    }
}
http_response_code($status);
if ($status === 200 && ($_GET['format'] ?? '') === 'raw') {
    header('Content-Type: text/plain; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    echo $markdown;
    exit;
}

$categories = array('OpenBMC Guides', 'Redfish APIs', 'Command Reference', 'System Architecture');
$documents = array();
foreach (scandir($rootDirectory) as $filename) {
    if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'md') {
        continue;
    }
    $documentPath = realpath($rootDirectory . '/' . $filename);
    if ($documentPath === false || dirname($documentPath) !== $rootDirectory || !is_file($documentPath)) {
        continue;
    }
    $category = 'OpenBMC Guides';
    if (preg_match('/redfish|rest|api/i', $filename)) {
        $category = 'Redfish APIs';
    } elseif (preg_match('/command|systemctl|journal|cli/i', $filename)) {
        $category = 'Command Reference';
    } elseif (preg_match('/bios|architecture|communication|system/i', $filename)) {
        $category = 'System Architecture';
    }
    $documents[] = array('file' => $filename, 'category' => $category);
}
$title = $mdFile ?: 'Document library';
if (preg_match('/^#\s+(.+)$/m', $markdown, $match)) {
    $title = trim(preg_replace('/[*_`]/', '', $match[1]));
}
$Parsedown = new MyParsedown();
$Parsedown->setSafeMode(true);
$wordCount = str_word_count($markdown);
$readingTime = max(1, (int) ceil($wordCount / 200));
$activeCategory = 'OpenBMC Guides';
foreach ($documents as $document) {
    if ($document['file'] === $mdFile) {
        $activeCategory = $document['category'];
    }
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <base href="../">
    <title><?= escapeHtml($title) ?> | Systems Library</title>
    <script>try { document.documentElement.dataset.theme = localStorage.getItem('docs-theme') === 'light' ? 'light' : 'dark'; } catch (error) {}</script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;450;500;600;700&display=swap">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="zcss/docs.css">
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
    <script defer src="zjs/docs.js"></script>
</head>
<body>
<a class="skip-link" href="<?= escapeHtml('library/render.php?file=' . rawurlencode($mdFile)) ?>#markdown-content">Skip to document</a>
<header class="topbar">
    <div class="topbar-navigation">
        <button class="icon-button" id="sidebar-toggle" title="Toggle document library" aria-label="Toggle document library" aria-controls="doc-sidebar" aria-expanded="true"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>
        <a class="brand" href="./"><i class="fa-solid fa-terminal" aria-hidden="true"></i><span>Systems<span class="brand-secondary"> / Library</span></span></a>
        <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./">Home</a><span>/</span><a href="library/render.php">Library</a><span>/</span><span class="current-file" title="<?= escapeHtml($mdFile) ?>"><?= escapeHtml($mdFile ?: 'Select a document') ?></span></nav>
    </div>
    <div class="topbar-tools">
        <div class="target-field"><span class="connection-dot" aria-hidden="true"></span><label for="ip-input">Target BMC IP</label><input id="ip-input" type="text" value="172.31.98.90" placeholder="172.31.98.90" spellcheck="false" aria-describedby="target-status"><button class="icon-button" id="copy-host" title="Copy target IP" aria-label="Copy target IP"><i class="fa-regular fa-copy" aria-hidden="true"></i></button></div>
        <div class="quick-actions" role="group" aria-label="Document actions">
            <?php if (!$error): ?><a class="icon-button" href="<?= escapeHtml('library/render.php?file=' . rawurlencode($mdFile) . '&format=raw') ?>" target="_blank" rel="noopener" title="Raw Markdown" aria-label="Raw Markdown"><i class="fa-solid fa-code" aria-hidden="true"></i></a><?php endif; ?>
            <button class="icon-button" id="export-pdf" title="Export PDF" aria-label="Export PDF"><i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i></button>
            <button class="icon-button" id="toc-toggle" title="Toggle table of contents" aria-label="Toggle table of contents" aria-controls="doc-toc" aria-expanded="true"><i class="fa-solid fa-list-ul" aria-hidden="true"></i></button>
            <button class="icon-button" id="theme-toggle" title="Dark Mode" aria-label="Dark Mode" aria-pressed="true"><i class="fa-regular fa-moon" aria-hidden="true"></i><span>Dark Mode</span></button>
        </div>
    </div>
</header>
<div class="doc-container">
    <aside class="doc-sidebar" id="doc-sidebar" aria-label="Document library">
        <div class="sidebar-heading"><i class="fa-solid fa-layer-group" aria-hidden="true"></i><span>DOCUMENTATION</span></div>
        <label class="file-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input id="file-search" type="search" placeholder="Find a document..." aria-label="Find a document"></label>
        <div class="nav-label">COLLECTIONS</div>
        <nav class="category-nav" aria-label="Collections">
            <?php $categoryIcons = array('fa-book-open', 'fa-plug', 'fa-terminal', 'fa-diagram-project'); foreach ($categories as $index => $category): ?>
            <button class="category-button" data-category="<?= escapeHtml($category) ?>" aria-pressed="false"><i class="fa-solid <?= $categoryIcons[$index] ?>" aria-hidden="true"></i><span><?= escapeHtml($category) ?></span><span class="category-count"><?= count(array_filter($documents, function ($document) use ($category) { return $document['category'] === $category; })) ?></span></button>
            <?php endforeach; ?>
        </nav>
        <div class="nav-label file-list-heading"><span>FILES</span><button class="text-button" id="clear-filter" hidden>Show all</button></div>
        <nav class="file-list" aria-label="Markdown files">
            <?php foreach ($documents as $document): ?>
            <a class="file-link<?= $document['file'] === $mdFile ? ' active' : '' ?>" data-category="<?= escapeHtml($document['category']) ?>" href="<?= escapeHtml('library/render.php?file=' . rawurlencode($document['file'])) ?>" <?= $document['file'] === $mdFile ? 'aria-current="page"' : '' ?> title="<?= escapeHtml($document['file']) ?>"><i class="fa-regular fa-file-lines" aria-hidden="true"></i><span><?= escapeHtml($document['file']) ?></span></a>
            <?php endforeach; ?>
        </nav>
        <p class="empty-files" id="empty-files" hidden>No matching documents.</p>
        <div class="sidebar-footer"><span class="connection-dot" aria-hidden="true"></span>Local documentation<span><?= count($documents) ?> files</span></div>
    </aside>
    <main class="doc-content" id="markdown-content" tabindex="-1">
        <?php if ($error): ?>
        <div class="error-state"><i class="fa-regular fa-folder-open" aria-hidden="true"></i><div class="eyebrow">DOCUMENT LIBRARY / <?= $status ?></div><h1><?= $status === 400 ? 'Select a document' : 'Document unavailable' ?></h1><p><?= escapeHtml($error) ?></p><a class="primary-link" href="./">Return home <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>
        <?php else: ?>
        <div class="document-meta"><span class="collection-tag"><?= escapeHtml($activeCategory) ?></span><span><i class="fa-regular fa-clock" aria-hidden="true"></i> <?= $readingTime ?> min read</span><span>Markdown</span></div>
        <article class="markdown-body"><?= $Parsedown->text($markdown) ?></article>
        <footer class="document-footer"><i class="fa-regular fa-file-lines" aria-hidden="true"></i><span><?= escapeHtml($mdFile) ?></span><a href="<?= escapeHtml('library/render.php?file=' . rawurlencode($mdFile) . '&format=raw') ?>">View source <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a></footer>
        <?php endif; ?>
    </main>
    <aside class="doc-toc" id="doc-toc" aria-label="Table of contents"><div class="nav-label">ON THIS PAGE</div><nav id="toc-links"></nav><p id="toc-empty" class="toc-empty" hidden>No sections in this document.</p><div class="toc-bottom"><span class="connection-dot" aria-hidden="true"></span><span id="target-status" role="status">Target: 172.31.98.90</span></div></aside>
</div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<dialog id="diagram-dialog" aria-labelledby="diagram-dialog-title"><div class="dialog-toolbar"><strong id="diagram-dialog-title">Diagram preview</strong><div id="modal-controls"></div><button class="icon-button" id="close-diagram" title="Close preview" aria-label="Close preview"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><div class="diagram-viewport" id="modal-viewport"><div class="diagram-canvas" id="modal-canvas"></div></div></dialog>
</body>
</html>