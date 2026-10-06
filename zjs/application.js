$(document).ready(function () {
    // Theme toggle functionality
    const themeToggle = $('#theme-toggle');
    const body = $('body');

    // Check for saved theme preference or default to dark mode
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        body.addClass('light-mode');
        themeToggle.html('<i class="fas fa-sun"></i> Light Mode');
    } else {
        themeToggle.html('<i class="fas fa-moon"></i> Dark Mode');
    }

    themeToggle.click(function () {
        body.toggleClass('light-mode');
        const isLight = body.hasClass('light-mode');
        const theme = isLight ? 'light' : 'dark';
        localStorage.setItem('theme', theme);

        if (isLight) {
            $(this).html('<i class="fas fa-sun"></i> Light Mode');
        } else {
            $(this).html('<i class="fas fa-moon"></i> Dark Mode');
        }
    });

    zebraRows('tbody tr:odd', 'odd');

    $('tbody tr').hover(function () {
        $(this).addClass('hovered');
    }, function () {
        $(this).removeClass('hovered');
    });

    //default each row to visible
    $('tbody tr').addClass('visible');

    //overrides CSS display:none property
    //so only users w/ JS will see the
    //filter box
    $('#search').show();

    // Intercept Tab key on filter to navigate to first result instead of Dark Mode button
    $('#filter').keydown(function (event) {
        if (event.keyCode == 9) { // Tab
            var $firstLink = $('tbody tr.visible:first a');
            if ($firstLink.length) {
                event.preventDefault();
                $firstLink.focus();
            }
        }
    });

    $('#filter').keyup(function (event) {
        //if esc is pressed or nothing is entered
        if (event.keyCode == 27 || $(this).val() == '') {
            //if esc is pressed we want to clear the value of search box
            $(this).val('');

            //we want each row to be visible because if nothing
            //is entered then all rows are matched.
            $('tbody tr').removeClass('visible').show().addClass('visible');
        }

        // if Enter is pressed, move focus to the first visible result
        else if (event.keyCode == 13) {
            var $firstLink = $('tbody tr.visible:first a');
            if ($firstLink.length) {
                $firstLink.focus();
            }
            return;
        }

        //if there is text, lets filter
        else {
            $('#loading').show();
            setTimeout(function () {
                filter('tbody tr', $('#filter').val());
                $('#loading').hide();
            }, 100);
        }

        //reapply zebra rows
        $('.visible').removeClass('odd');
        zebraRows('.visible:odd', 'odd');
    });

    //grab all header rows
    $('thead th').each(function (column) {
        $(this).addClass('sortable')
            .click(function () {
                var findSortKey = function ($cell) {
                    return $cell.find('.sort-key').text().toUpperCase() + ' ' + $cell.text().toUpperCase();
                };

                var sortDirection = $(this).is('.sorted-asc') ? -1 : 1;

                //step back up the tree and get the rows with data
                //for sorting
                var $rows = $(this).parent()
                    .parent()
                    .parent()
                    .find('tbody tr')
                    .get();

                //loop through all the rows and find
                $.each($rows, function (index, row) {
                    row.sortKey = findSortKey($(row).children('td').eq(column));
                });

                //compare and sort the rows alphabetically
                $rows.sort(function (a, b) {
                    if (a.sortKey < b.sortKey) return -sortDirection;
                    if (a.sortKey > b.sortKey) return sortDirection;
                    return 0;
                });

                //add the rows in the correct order to the bottom of the table
                $.each($rows, function (index, row) {
                    $('tbody').append(row);
                    row.sortKey = null;
                });

                //identify the column sort order
                $('th').removeClass('sorted-asc sorted-desc');
                var $sortHead = $('th').filter(':nth-child(' + (column + 1) + ')');
                sortDirection == 1 ? $sortHead.addClass('sorted-asc') : $sortHead.addClass('sorted-desc');

                //identify the column to be sorted by
                $('td').removeClass('sorted')
                    .filter(':nth-child(' + (column + 1) + ')')
                    .addClass('sorted');

                $('.visible').removeClass('odd');
                zebraRows('.visible:odd', 'odd');
            });
    });

    // Arrow key navigation within result rows
    $('tbody').on('keydown', 'a', function (event) {
        var $visibleLinks = $('tbody tr.visible a');
        var currentIndex = $visibleLinks.index(this);

        if (event.keyCode == 40) { // ArrowDown
            event.preventDefault();
            var $next = $visibleLinks.eq(currentIndex + 1);
            if ($next.length) $next.focus();
        } else if (event.keyCode == 38) { // ArrowUp
            event.preventDefault();
            if (currentIndex === 0) {
                $('#filter').focus();
            } else {
                var $prev = $visibleLinks.eq(currentIndex - 1);
                if ($prev.length) $prev.focus();
            }
        } else if (event.keyCode == 27) { // Escape
            $('#filter').focus();
        }
    });
});


//used to apply alternating row styles
function zebraRows(selector, className) {
    $(selector).removeClass(className)
        .addClass(className);
}

//filter results based on query
function filter(selector, query) {
    query = $.trim(query); //trim white space
    query = query.replace(/ /gi, '|'); //add OR for regex

    $(selector).each(function () {
        ($(this).text().search(new RegExp(query, "i")) < 0) ? $(this).hide().removeClass('visible') : $(this).show().addClass('visible');
    });
}
