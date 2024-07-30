let allJobs = [];
let currentPage = 0;
const jobsPerPage = 9;

document.getElementById('searchJobs').addEventListener('click', async () => {
    const keyword = document.getElementById('keyword').value.trim().toLowerCase();
    const jobList = document.getElementById('jobList');
    jobList.innerHTML = '<p style="color: white;">Loading...</p>';

    if (!keyword) {
        jobList.innerHTML = '<p>Please enter a keyword to search.</p>';
        return;
    }

    try {
        const [himalayasJobs, remotiveJobs, remoteOkJobs] = await Promise.all([
            fetchJobs(`https://himalayas.app/jobs/api?q=${keyword}`),
            fetchJobs(`https://remotive.com/api/remote-jobs?limit=10&search=${keyword}`),
            fetchJobs(`https://remoteok.com/api?tag=${keyword}`)
        ]);

        allJobs = [
            ...normalizeHimalayasJobs(himalayasJobs, keyword),
            ...normalizeRemotiveJobs(remotiveJobs.jobs, keyword),
            ...normalizeRemoteOkJobs(remoteOkJobs, keyword)
        ];

        // Filter jobs posted within the last 4 months
        const fourMonthsAgo = new Date();
        fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

        const recentJobs = allJobs.filter(job => new Date(job.datePosted) >= fourMonthsAgo);

        // Remove duplicates
        const uniqueJobs = [...new Map(recentJobs.map(job => [job.title + job.company, job])).values()];

        // Sort jobs by datePosted (latest first)
        uniqueJobs.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));

        // Reset pagination
        currentPage = 0;

        // Display the first page of jobs
        displayJobs(uniqueJobs.slice(currentPage * jobsPerPage, (currentPage + 1) * jobsPerPage));

        // Show the "More" button
        document.getElementById('moreJobs').style.display = 'block';

    } catch (error) {
        console.error('Error fetching jobs:', error);
        jobList.innerHTML = `<p>Error fetching job data. Please try again later. Error: ${error.message}</p>`;
    }
});

document.getElementById('moreJobs').addEventListener('click', () => {
    const jobList = document.getElementById('jobList');
    
    if (currentPage * jobsPerPage >= allJobs.length) {
        jobList.innerHTML += '<p>No more jobs available.</p>';
        return;
    }

    // Move to the next page
    currentPage++;

    // Display the next page of jobs
    displayJobs(allJobs.slice(currentPage * jobsPerPage, (currentPage + 1) * jobsPerPage), true);
});

async function fetchJobs(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error);
        throw error;
    }
}

function normalizeHimalayasJobs(jobData, keyword) {
    console.log('Himalayas job data:', jobData);
    if (!Array.isArray(jobData)) {
        console.error('Unexpected data format from Himalayas API:', jobData);
        return [];
    }
    return jobData
        .filter(job => job.title && job.title.toLowerCase().includes(keyword))
        .map(job => ({
            title: job.title || 'No Title',
            company: job.company.name || 'No Company',
            location: job.location || 'No Location',
            salary: job.salary || 'No Salary',
            description: job.description || 'No Description',
            datePosted: job.published_at || 'No Date',
            url: job.url || '#'
        }));
}

function normalizeRemotiveJobs(jobData, keyword) {
    console.log('Remotive job data:', jobData);
    if (!Array.isArray(jobData)) {
        console.error('Unexpected data format from Remotive API:', jobData);
        return [];
    }
    return jobData
        .filter(job => job.title && job.title.toLowerCase().includes(keyword))
        .map(job => ({
            title: job.title || 'No Title',
            company: job.company_name || 'No Company',
            location: job.candidate_required_location || 'No Location',
            salary: job.salary || 'No Salary',
            description: job.description || 'No Description',
            datePosted: job.publication_date || 'No Date',
            url: job.url || '#'
        }));
}

function normalizeRemoteOkJobs(jobData, keyword) {
    console.log('Remote OK job data:', jobData);
    if (!Array.isArray(jobData)) {
        console.error('Unexpected data format from Remote OK API:', jobData);
        return [];
    }
    return jobData
        .filter(job => job.position && job.position.toLowerCase().includes(keyword))
        .map(job => ({
            title: job.position || 'No Title',
            company: job.company || 'No Company',
            location: job.location || 'No Location',
            salary: job.salary || 'No Salary',
            description: job.description || 'No Description',
            datePosted: job.date || 'No Date',
            url: job.url || '#'
        }));
}

function displayJobs(jobs, append = false) {
    const jobList = document.getElementById('jobList');
    const jobHtml = jobs.map(job => `
        <div class="job-item">
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Date Posted:</strong> ${new Date(job.datePosted).toLocaleDateString()}</p>
            <a href="${job.url}" target="_blank">View Job</a>
        </div>
    `).join('');

    if (append) {
        jobList.innerHTML += jobHtml;
    } else {
        jobList.innerHTML = jobHtml;
    }
}
