(function(){
    // get base variable
    var baseUrl = $('#url_base').html();
    var filesApiUrl = $('#url_api_files').html() + "/";
    var breadcrumb = $('#main_breadcrumb');
    var baseBlock = $('#files_row_base');
    var filesBlock = $('.files_block');
    setHomeDirectoryInBreadcrumbIfEmpty();

    updateView(filesApiUrl + breadcrumb.data('path'));
    breadcrumb.on('pathChange', setFileClickEvent);
    breadcrumb.on('breadcrumbClick', setBreadcrumbClick);

    /* -----------    Function Block    ----------- */
    
    function updateView(url) {
        url = url.replace('..', '!');
        $.ajax({url: url, success: function(result){
            displayFolder(result);
        }});
    }

    function setBreadcrumbClick() {
        updateView(filesApiUrl + breadcrumb.data('path'));
    }
    
    function setFileClickEvent() {
        filesBlock.find('.files_row_name').click(function () {

            rowClick($(this).parent());

        });
    }

    function rowClick(_this) {
        var type = $(_this).find('.files_type').html();
        var url = $(_this).find('.files_url').html();
        if (type == 'dir') {
            updateView(url);
        }
    }

    function displayFolder(result) {
        var block;
        var prepareRow;
        var i;

        breadcrumb.data('path', result.folder);
        filesBlock.html('');

        if ($.isEmptyObject(result)) {
            return;
        }

        if (result.dir.directory) {
            for (i=0;i<result.dir.directory.length; i++) {
                block = getBaseBlock();
                prepareRow = getPrepareBlock(result.dir.directory[i], block, 'dir');
                prepareRow.appendTo(filesBlock);
            }
        }

        if (result.dir.file) {
            for (i=0;i<result.dir.file.length; i++) {
                block = getBaseBlock();
                prepareRow = getPrepareBlock(result.dir.file[i], block, 'file');
                prepareRow.appendTo(filesBlock);
            }
        }

        breadcrumb.trigger('pathChange');
    }

    function setHomeDirectoryInBreadcrumbIfEmpty() {
        if (! breadcrumb.data('path')) {
            var folder_path = $('#folder_path').html();
            if (folder_path != '') {
                breadcrumb.data('path', folder_path);
            } else {
                breadcrumb.data('path', 'home:');
            }
        }
    }

    function getBaseBlock() {
        return baseBlock.find('.files_row').clone();
    }

    function getPrepareBlock(row, block, type) {
        var dateModify = new Date(row[2]);
        var dateNow = new Date();

        block.find('.files_name').html(row[0]);
        block.find('.files_size').html(bytesToSize(row[1]));
        block.find('.files_mod').html(getTimeAgoString(dateModify, dateNow));
        block.find('.files_url').html(filesApiUrl + breadcrumb.data('path') + ':' + row[0]);
        block.attr('data-path', breadcrumb.data('path') + ':' + row[0]);
        block.attr('data-name', row[0]);

        if (type == 'file') {
            var split = row[0].split('.');
            type = split[split.length-1];
        }

        block.find('.files_check').html(getIcon(type));
        block.find('.files_type').html(type);
        block.attr('data-type', type);

        return block;
    }

    function getIcon(type) {
        switch (type) {
            case 'dir': return '<i class="fa fa-folder fa-2x" aria-hidden="true"></i>'; break;
            case 'xlsx': return '<i class="fa fa-file-excel-o" aria-hidden="true"></i>'; break;
            case 'xsl': return '<i class="fa fa-file-excel-o" aria-hidden="true"></i>'; break;
            case 'doc': return '<i class="fa fa-file-word-o" aria-hidden="true"></i>'; break;
            case 'docx': return '<i class="fa fa-file-word-o" aria-hidden="true"></i>'; break;
            case 'pdf': return '<i class="fa fa-file-pdf-o" aria-hidden="true"></i>'; break;
            case 'mp3': return '<i class="fa fa-file-audio-o" aria-hidden="true"></i>'; break;
            case 'ogg': return '<i class="fa fa-file-audio-o" aria-hidden="true"></i>'; break;
            case 'zip': return '<i class="fa fa-file-archive-o" aria-hidden="true"></i>'; break;
            case 'rar': return '<i class="fa fa-file-archive-o" aria-hidden="true"></i>'; break;
            case '7z': return '<i class="fa fa-file-archive-o" aria-hidden="true"></i>'; break;
            case 'jpg': return '<i class="fa fa-file-image-o" aria-hidden="true"></i>'; break;
            case 'jpeg': return '<i class="fa fa-file-image-o" aria-hidden="true"></i>'; break;
            case 'gif': return '<i class="fa fa-file-image-o" aria-hidden="true"></i>'; break;
            case 'png': return '<i class="fa fa-file-image-o" aria-hidden="true"></i>'; break;
            case 'txt': return '<i class="fa fa-file-text-o" aria-hidden="true"></i>'; break;
            case 'md': return '<i class="fa fa-file-text-o" aria-hidden="true"></i>'; break;
            case 'impress': return '<i class="fa fa-file-text-o" aria-hidden="true"></i>'; break;
            case 'mov': return '<i class="fa fa-file-video-o" aria-hidden="true"></i>'; break;
            case 'mp4': return '<i class="fa fa-file-video-o" aria-hidden="true"></i>'; break;
            case 'avi': return '<i class="fa fa-file-video-o" aria-hidden="true"></i>'; break;
            case 'php': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'css': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'scss': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'make': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'json': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'rb': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'sql': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'html': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'js': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'cpp': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'c': return '<i class="fa fa-file-code-o" aria-hidden="true"></i>'; break;
            case 'ppt': return '<i class="fa fa-file-powerpoint-o" aria-hidden="true"></i>'; break;
            case 'pptx': return '<i class="fa fa-file-powerpoint-o" aria-hidden="true"></i>'; break;
            default: return '<i class="fa fa-file-o" aria-hidden="true"></i>'; break;
        }
    }

    function getTimeAgoString(earlierDate,laterDate) {
        var timeDifferent = get_time_difference(earlierDate,laterDate);
        if (timeDifferent.month > 0) {
            return timeDifferent.month + ' months ago';
        }
        if (timeDifferent.days > 0) {
            return timeDifferent.days + ' days ago';
        }
        if (timeDifferent.hours > 0) {
            return timeDifferent.hours + ' hours ago';
        }
        if (timeDifferent.minutes > 0) {
            return timeDifferent.minutes + ' minutes ago';
        }
        return 'just now';
    }

    function get_time_difference(earlierDate,laterDate)
    {
        var nTotalDiff = laterDate.getTime() - earlierDate.getTime();
        var oDiff = {};

        oDiff.month = Math.floor(nTotalDiff/1000/60/60/24/30);
        nTotalDiff -= oDiff.month*1000*60*60*24*30;

        oDiff.days = Math.floor(nTotalDiff/1000/60/60/24);
        nTotalDiff -= oDiff.days*1000*60*60*24;

        oDiff.hours = Math.floor(nTotalDiff/1000/60/60);
        nTotalDiff -= oDiff.hours*1000*60*60;

        oDiff.minutes = Math.floor(nTotalDiff/1000/60);
        nTotalDiff -= oDiff.minutes*1000*60;

        oDiff.seconds = Math.floor(nTotalDiff/1000);

        return oDiff;
    }

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    }
})();