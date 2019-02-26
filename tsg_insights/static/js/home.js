// modals
const modals = document.getElementsByClassName('js-modal');
const urlParams = new URLSearchParams(window.location.search);
for (const modal of modals) {
    const trigger = document.getElementById(modal.dataset.trigger);
    if(trigger){
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            modal.classList.remove("hidden");
        });
    }

    for (const close_button of modal.getElementsByClassName('close-button')) {
        close_button.addEventListener('click', (event) => {
            event.preventDefault();
            modal.classList.add("hidden");
        });
    }

    if(urlParams.has(modal.id)){
        trigger.click();
    }
}

// filter by publisher
const datasetFilter = document.getElementById('dataset-filter');
const registryList = document.getElementById('registry-list');
datasetFilter.addEventListener('keyup', (event) => {
    event.preventDefault();
    const search_term = event.target.value.toLowerCase().replace(/[\W_]+/g, " ");
    for (const publisher of registryList.getElementsByClassName('homepage__data-selection__set')){
        var publisher_name = publisher.getElementsByClassName('homepage__data-selection__set-name')[0].textContent;
        publisher_name = publisher_name.toLowerCase().replace(/[\W_]+/g, " ");
        if (publisher_name.includes(search_term)){
            publisher.classList.remove("hidden");
        } else {
            publisher.classList.add("hidden");
        }
    }
});

// function to track a job and update the status
const track_job = function(jobid){
    const uploadProgress = document.getElementById('upload-progress');

    // set loading state
    var progressLoader = document.getElementById("upload-progress-loader");
    progressLoader.style.display = 'flex';
    var resultsButton = document.getElementById("upload-progress-results");
    const cancelFetchText = 'Cancel fetching file';
    resultsButton.innerText = cancelFetchText;
    resultsButton.href = '#';
    resultsButton.classList.add("invalid");

    // set progress bar states
    var mainProgress = document.getElementById("upload-progress-main");
    var mainProgressBar = mainProgress.getElementsByTagName("progress")[0];
    mainProgress.getElementsByClassName("homepage__data-fetching__process-name")[0].innerText = 'Fetching data';
    mainProgress.getElementsByClassName("homepage__data-fetching__steps")[0].innerText = '';
    mainProgressBar.value = 0;
    mainProgressBar.max = 10;

    var subProgress = document.getElementById("upload-progress-sub");
    var subProgressBar = subProgress.getElementsByTagName("progress")[0];
    subProgress.getElementsByClassName("homepage__data-fetching__process-name")[0].innerText = '';
    subProgress.getElementsByClassName("homepage__data-fetching__steps")[0].innerText = '';
    subProgress.style.display = "none";
    subProgressBar.value = 0;
    subProgressBar.max = 10;

    console.log("HELLO");

    // what happens when cancel button is pressed
    resultsButton.addEventListener('click', (event)=>{
        if (resultsButton.innerText != cancelFetchText){
            return true;
        }
        event.preventDefault();
        fetch(`/job/${jobid}/cancel`)
            .then(function (response) {
                return response.json();
            })
            .then(function (jobStatus) {
                console.log("Job cancelled");
                console.log(jobStatus);
            });
    });

    console.log("wOORLD");

    // refresh the job ID every X seconds to get the current status
    const intervalID = setInterval(() => {
        fetch(`/job/${jobid}`)
            .then(function (response) {
                return response.json();
            })
            .then(function (jobStatus) {
                // update the current status in the dialogue
                progressLoader.style.display = 'none';

                switch (jobStatus.status) {
                    case "not-found":
                        uploadProgress.innerHTML = `<p>File could not be found</p>`;
                        clearInterval(intervalID);
                        break;

                    case "processing-error":
                        var p = document.createElement('p');
                        p.innerText = 'Error processing the file ';
                        var e_details = document.createElement('div');
                        e_details.innerHTML = `<pre>${jobStatus.exc_info}</pre>`;
                        e_details.style['display'] = 'none';
                        e_details.classList.add("hidden");
                        var e_toggle = document.createElement('a');
                        e_toggle.innerText = 'Show error';
                        e_toggle.setAttribute('href', '#');
                        e_toggle.addEventListener('click', (event) => {
                            event.preventDefault();
                            e_details.classList.toggle('hidden');
                            if(e_details.classList.contains('hidden')){
                                e_toggle.innerText = 'Show error';
                                e_details.style['display'] = 'none';
                            } else {
                                e_toggle.innerText = 'Hide error';
                                e_details.style['display'] = 'inherit';
                            }
                        })
                        p.append(e_toggle);
                        uploadProgress.innerHTML = '';
                        uploadProgress.append(p, e_details);
                        clearInterval(intervalID);
                        break;

                    case "in-progress":
                        if(!jobStatus.progress){
                            progressLoader.style.display = 'flex';
                            break;
                        }
                        resultsButton.classList.remove("invalid");

                        /**
                         * jobStatus.stages has a description of the different stages
                         * jobStatus.progress['stage'] gives the index of the current stage
                         * jobStatus.progress['progress'] holds an array [currentindex, totalsize] of progress through the current stage
                         */
                        mainProgress.getElementsByClassName("homepage__data-fetching__process-name")[0].innerText = jobStatus.stages[jobStatus.progress['stage'] + 1];
                        mainProgress.getElementsByClassName("homepage__data-fetching__steps")[0].innerText = `Stage ${jobStatus.progress['stage'] + 1} of ${jobStatus.stages.length}`;
                        mainProgressBar.value = jobStatus.progress['stage'] + 1;
                        mainProgressBar.max = jobStatus.stages.length;

                        if (jobStatus.progress['progress']) {
                            subProgress.style.display = "inherit";
                            subProgress.getElementsByClassName("homepage__data-fetching__process-name")[0].innerText = `${jobStatus.progress['progress'][0]} of ${jobStatus.progress['progress'][1]}`;
                            // subProgress.getElementsByClassName("homepage__data-fetching__steps")[0].innerText = `${jobStatus.progress['progress'][0]} of ${jobStatus.progress['progress'][1]}`;
                            subProgressBar.value = jobStatus.progress['progress'][0];
                            subProgressBar.max = jobStatus.progress['progress'][1];
                        } else {
                            subProgress.style.display = "none";
                        }
                        break;

                    case "completed":
                        // redirect to the file when the fetch has finished
                        clearInterval(intervalID);

                        var resultUrl = `/file/${jobStatus.result[0]}`;

                        // set up progress bars
                        subProgress.style.display = "none";
                        mainProgress.getElementsByClassName("homepage__data-fetching__process-name")[0].innerText = 'Completed';
                        mainProgress.getElementsByClassName("homepage__data-fetching__steps")[0].innerText = '';
                        mainProgressBar.value = mainProgressBar.max;
                        
                        // add href to results button
                        resultsButton.innerText = 'View results';
                        resultsButton.href = resultUrl;
                        resultsButton.classList.remove("invalid");

                        // document.getElementById('upload-progress-modal').classList.add("hidden");
                        // window.location.href = resultUrl;
                        break;

                    default:
                        progressLoader.style.display = 'flex';

                }
            });
    }, 2000);


}

const sendFile = function (file) {

    // open the fetch file dialogue
    document.getElementById('upload-progress-modal').classList.remove("hidden");
    document.getElementById('upload-dataset-modal').classList.add("hidden");

    var formData = new FormData();
    formData.append('file', file);

    // start the job and get the job ID
    fetch('/fetch/upload', {
        method:'POST',
        body: formData
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (jobJson) {
            const jobid = jobJson['job'];
            track_job(jobid);
        });

}

// trigger the fetch from registry
for (const registryLink of document.getElementsByClassName("fetch-from-registry")){
    registryLink.addEventListener('click', (event) => {
        event.preventDefault();

        // open the fetch file dialogue
        document.getElementById('upload-progress-modal').classList.remove("hidden");
        document.getElementById('file-selection-modal').classList.add("hidden");

        // start the job and get the job ID
        fetch(registryLink.href)
            .then(function (response) {
                return response.json();
            })
            .then(function (jobJson) {
                const jobid = jobJson['job'];
                track_job(jobid);
            });
    })
}

// trigger upload when a file is dropped onto the dropzone
const dropzone = document.getElementById('file-upload-dropzone');
const fileInput = document.getElementById('file-upload-input');

dropzone.onclick = function (event) {
    event.preventDefault();
    fileInput.click();
}

dropzone.ondragover = dropzone.ondragenter = function (event) {
    event.stopPropagation();
    event.preventDefault();
    // @TODO:  add styles here to signal that they're in the right place
    // eg: border: 8px dashed lightgray;
}

dropzone.ondrop = function (event) {
    event.stopPropagation();
    event.preventDefault();

    const filesArray = event.dataTransfer.files;
    for (let i = 0; i < filesArray.length; i++) {
        sendFile(filesArray[i]);
    }
}

fileInput.onchange = function (event) {
    event.stopPropagation();
    event.preventDefault();

    const filesArray = event.target.files;
    for (let i = 0; i < filesArray.length; i++) {
        sendFile(filesArray[i]);
    }
}