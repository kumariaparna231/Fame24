let posts = [];
let unsubscribePosts = null;
let currentFilter = "All";
let currentUser = localStorage.getItem("fame24User") || "";
let activeContributionPostId = null;
let spotlightPasses = [];
function loadSpotlightPasses() {
  const today = new Date()
    .toISOString()
    .split("T")[0];

  db.collection("spotlightPasses")
    .where("date", "==", today)
    .onSnapshot(snapshot => {

      spotlightPasses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderPeople();
    });
}

function savePosts() {
  // Firestore use ho raha hai, localStorage nahi.
}
function loadPostsFromFirebase() {
  if (unsubscribePosts) {
    return;
  }

  unsubscribePosts = db.collection("posts")
    .orderBy("id", "desc")
    .onSnapshot(snapshot => {
      posts = snapshot.docs.map(doc => {
        return {
          firebaseId: doc.id,
          ...doc.data()
        };
      });

      renderAll();
    }, error => {
      console.error("Firebase load error:", error);
      alert("Firebase se posts load nahi ho rahe.");
    });
}
function checkLogin() {
  if (currentUser) {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("bottomNav").classList.remove("hidden");
    document.getElementById("userBar").classList.remove("hidden");
    document.getElementById("loggedUserText").innerText = "@" + currentUser;
    loadPostsFromFirebase();
    loadSpotlightPasses();
    showPage("home");
  } else {
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("homePage").classList.add("hidden");
    document.getElementById("createPage").classList.add("hidden");
    document.getElementById("feedPage").classList.add("hidden");
    document.getElementById("profilePage").classList.add("hidden");
    document.getElementById("bottomNav").classList.add("hidden");
    document.getElementById("userBar").classList.add("hidden");
  }
}

function loginUser() {
  const username = document.getElementById("loginNameInput").value.trim();

  if (!username) {
    alert("Username enter karo.");
    return;
  }

  currentUser = username;
  localStorage.setItem("fame24User", currentUser);

  checkLogin();
}

function logoutUser() {
  const confirmLogout = confirm("Logout karna hai?");

  if (!confirmLogout) {
    return;
  }

  currentUser = "";
  localStorage.removeItem("fame24User");

  checkLogin();
}

function showPage(page) {
    document.getElementById("homePage").classList.add("hidden");
document.getElementById("createPage").classList.add("hidden");
document.getElementById("feedPage").classList.add("hidden");
document.getElementById("peoplePage").classList.add("hidden");
document.getElementById("profilePage").classList.add("hidden");

document.getElementById("homeBtn").classList.remove("active");
document.getElementById("createBtn").classList.remove("active");
document.getElementById("feedBtn").classList.remove("active");
document.getElementById("peopleBtn").classList.remove("active");
document.getElementById("profileBtn").classList.remove("active");
  if (page === "profile") {
  document.getElementById("profilePage").classList.remove("hidden");
  document.getElementById("profileBtn").classList.add("active");
}
if (page === "people") {
  document.getElementById("peoplePage").classList.remove("hidden");
  document.getElementById("peopleBtn").classList.add("active");
}

  if (page === "home") {
    document.getElementById("homePage").classList.remove("hidden");
    document.getElementById("homeBtn").classList.add("active");
  }

  if (page === "create") {
    document.getElementById("createPage").classList.remove("hidden");
    document.getElementById("createBtn").classList.add("active");
  }

  if (page === "feed") {
    document.getElementById("feedPage").classList.remove("hidden");
    document.getElementById("feedBtn").classList.add("active");
  }

  renderAll();
}
function filterPosts(category, button) {
  currentFilter = category;

  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach(btn => btn.classList.remove("active-filter"));

  button.classList.add("active-filter");

  renderFeed();
}
function createPost() {
  const name = currentUser;
  const category = document.getElementById("categoryInput").value;
  const caption = document.getElementById("captionInput").value.trim();
  const imageFile = document.getElementById("imageInput").files[0];

  if (!currentUser) {
    alert("Pehle login karo.");
    return;
  }

  if (!category || !caption) {
    alert("Category aur post text fill karo.");
    return;
  }
  function saveNewPost(imageData) {
    const newPost = {
      id: Date.now(),
      name: name,
      category: category,
      caption: caption,
      image: imageData,
      votes: 0,
      comments: [],
      contributions: [],
      reactions: {
        funny: 0,
        fire: 0,
        love: 0,
        relatable: 0
      },
      createdAt: new Date().toLocaleString()
    };

    db.collection("posts")
      .add(newPost)
      .then(() => {
        clearForm();
        showPage("feed");
      })
      .catch(error => {
        console.error("Post save error:", error);
        alert("Post Firebase me save nahi hua.");
      });
  }

  if (imageFile) {
    const reader = new FileReader();

    reader.onload = function(event) {
      saveNewPost(event.target.result);
    };

    reader.readAsDataURL(imageFile);
  } else {
    saveNewPost("");
  }
}
    
function clearForm() {
  document.getElementById("categoryInput").value = "";
  document.getElementById("captionInput").value = "";
  document.getElementById("imageInput").value = "";
}
function reactPost(id, type) {
  const post = posts.find(p => p.id === id);

  if (!post || !post.firebaseId) {
    alert("Post Firebase me nahi mila.");
    return;
  }

  const fieldPath = `reactions.${type}`;

  db.collection("posts").doc(post.firebaseId).update({
    [fieldPath]: firebase.firestore.FieldValue.increment(1)
  })
  .catch(error => {
    console.error("Reaction update error:", error);
    alert("Reaction update nahi hua.");
  });
}
function votePost(id) {
  let votedPosts = JSON.parse(localStorage.getItem("votedPosts")) || [];

  if (votedPosts.includes(id)) {
    alert("Tum is post ko already vote kar chuki ho.");
    return;
  }

  const post = posts.find(p => p.id === id);

  if (!post || !post.firebaseId) {
    alert("Post Firebase me nahi mila.");
    return;
  }

  db.collection("posts").doc(post.firebaseId).update({
    votes: firebase.firestore.FieldValue.increment(1)
  })
  .then(() => {
    votedPosts.push(id);
    localStorage.setItem("votedPosts", JSON.stringify(votedPosts));
  })
  .catch(error => {
    console.error("Vote update error:", error);
    alert("Vote update nahi hua.");
  });
}
function addComment(id) {
  const input = document.getElementById(`commentInput-${id}`);
  const text = input.value.trim();

  if (!currentUser) {
    alert("Pehle login karo.");
    return;
  }

  if (!text) {
    alert("Comment likho pehle.");
    return;
  }

  const post = posts.find(p => p.id === id);

  if (!post || !post.firebaseId) {
    alert("Post Firebase me nahi mila.");
    return;
  }

  const newComment = {
    name: currentUser,
    text: text,
    time: new Date().toLocaleTimeString()
  };

  db.collection("posts").doc(post.firebaseId).update({
    comments: firebase.firestore.FieldValue.arrayUnion(newComment)
  })
  .then(() => {
    input.value = "";
  })
  .catch(error => {
    console.error("Comment update error:", error);
    alert("Comment update nahi hua.");
  });
}
function addContribution(id) {
  activeContributionPostId = id;

  document
    .getElementById("contributionModal")
    .classList.remove("hidden");

  document.getElementById("contributionText").value = "";
  document.getElementById("contributionImage").value = "";
}
function closeContributionModal() {
  document
    .getElementById("contributionModal")
    .classList.add("hidden");

  activeContributionPostId = null;
}
function saveContribution() {
  const text = document
    .getElementById("contributionText")
    .value
    .trim();

  const imageFile = document
    .getElementById("contributionImage")
    .files[0];

  if (!text && !imageFile) {
    alert("Text ya photo add karo.");
    return;
  }

  if (!currentUser) {
    alert("Pehle login karo.");
    return;
  }

  const post = posts.find(
    p => p.id === activeContributionPostId
  );

  if (!post || !post.firebaseId) {
    alert("Post nahi mila.");
    return;
  }
 function saveToFirebase(imageData) {
  const newContribution = {
    name: currentUser,
    text: text,
    image: imageData || "",
    time: new Date().toLocaleString(),
    status: "pending"
  };

  db.collection("posts")
    .doc(post.firebaseId)
    .update({
      contributions:
        firebase.firestore.FieldValue.arrayUnion(
          newContribution
        )
    })
    .then(() => {
      closeContributionModal();
    })
    .catch(error => {
      console.error("Contribution save error:", error);
      alert("Moment add nahi hua.");
    });
}

  if (imageFile) {
    const reader = new FileReader();

    reader.onload = function(event) {
      saveToFirebase(event.target.result);
    };

    reader.readAsDataURL(imageFile);
  } else {
    saveToFirebase("");
  }
}
function approveContribution(postId, contributionIndex) {
  const post = posts.find(p => p.id === postId);

  if (!post || !post.firebaseId) {
    alert("Post nahi mila.");
    return;
  }

  if (post.name !== currentUser) {
    alert("Sirf post owner approve kar sakta hai.");
    return;
  }

  const updatedContributions = [
    ...(post.contributions || [])
  ];

  updatedContributions[contributionIndex] = {
    ...updatedContributions[contributionIndex],
    status: "accepted"
  };

  db.collection("posts")
    .doc(post.firebaseId)
    .update({
      contributions: updatedContributions
    })
    .catch(error => {
      console.error("Approve error:", error);
      alert("Moment approve nahi hua.");
    });
}
function rejectContribution(postId, contributionIndex) {
  const post = posts.find(p => p.id === postId);

  if (!post || !post.firebaseId) {
    alert("Post nahi mila.");
    return;
  }

  if (post.name !== currentUser) {
    alert("Sirf post owner reject kar sakta hai.");
    return;
  }

  const updatedContributions =
    (post.contributions || []).filter(
      (item, index) => index !== contributionIndex
    );

  db.collection("posts")
    .doc(post.firebaseId)
    .update({
      contributions: updatedContributions
    })
    .catch(error => {
      console.error("Reject error:", error);
      alert("Moment reject nahi hua.");
    });
}
function sharePost(id) {
  const post = posts.find(p => p.id === id);

  const text = `Vote for ${post.name} on Fame24! Category: ${post.category}. "${post.caption}"`;

  if (navigator.share) {
    navigator.share({
      title: "Fame24",
      text: text
    });
  } else {
    navigator.clipboard.writeText(text);
    alert("Share text copied!");
  }
}
function deletePost(id) {
  const post = posts.find(p => p.id === id);

  if (!post || !post.firebaseId) {
    alert("Post Firebase me nahi mila.");
    return;
  }

  if (post.name !== currentUser) {
    alert("Tum sirf apni post delete kar sakti ho.");
    return;
  }

  const confirmDelete = confirm("Ye post delete karni hai?");

  if (!confirmDelete) {
    return;
  }

  db.collection("posts").doc(post.firebaseId).delete()
    .then(() => {
      let votedPosts = JSON.parse(localStorage.getItem("votedPosts")) || [];
      votedPosts = votedPosts.filter(votedId => votedId !== id);
      localStorage.setItem("votedPosts", JSON.stringify(votedPosts));

      alert("Post delete ho gayi.");
    })
    .catch(error => {
      console.error("Delete error:", error);
      alert("Post delete nahi hui.");
    });
}
function reportPost(id) {
  const post = posts.find(p => p.id === id);

  if (!post || !post.firebaseId) {
    alert("Post Firebase me nahi mila.");
    return;
  }

  if (!currentUser) {
    alert("Pehle login karo.");
    return;
  }

  const reason = prompt("Report reason likho: spam, abusive, fake, harassment, etc.");

  if (!reason || reason.trim() === "") {
    alert("Report reason required hai.");
    return;
  }

  const reportData = {
    postFirebaseId: post.firebaseId,
    postId: post.id,
    postOwner: post.name,
    reportedBy: currentUser,
    reason: reason.trim(),
    caption: post.caption,
    category: post.category,
    createdAt: new Date().toLocaleString()
  };

  db.collection("reports")
    .add(reportData)
    .then(() => {
      alert("Report submit ho gayi. Thanks for keeping Fame24 safe.");
    })
    .catch(error => {
      console.error("Report error:", error);
      alert("Report submit nahi hui.");
    });
}
function getTimeLeft(postId) {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const endTime = postId + twentyFourHours;
  const remaining = endTime - now;

  if (remaining <= 0) {
    return "Expired";
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m left`;
}
function renderFeed() {
  const feedBox = document.getElementById("feedBox");
  const filteredPosts = currentFilter === "All"
  ? posts
  : posts.filter(post => post.category === currentFilter);

if (filteredPosts.length === 0) {
  feedBox.innerHTML = `<div class="empty">Is category me abhi koi post nahi ✨</div>`;
  return;
}

feedBox.innerHTML = filteredPosts.map(post => `
    <div class="post-card">
      <div class="post-top">
        <div>
          <div class="user">
  @${post.name}
  ${
    post.name.toLowerCase() ===
    getSpotlightWinnerName().toLowerCase()
      ? " 👑"
      : ""
  }
</div>
          <div class="votes">${post.votes} votes • ⏳ ${getTimeLeft(post.id)}</div>
        </div>
        <div class="category">${post.category}</div>
      </div>

      ${post.image ? `<img src="${post.image}" class="post-image" alt="Post image">` : ""}

      <div class="caption">${post.caption}</div>
      <div class="post-actions">
  <button class="vote-btn" onclick="votePost(${post.id})">🔥 Vote</button>
  <button class="share-btn" onclick="sharePost(${post.id})">Share</button>
  <button
  class="contribute-btn"
  onclick="addContribution(${post.id})"
>
  ✨ Add to Moment
</button>
  <button class="report-btn" onclick="reportPost(${post.id})">Report</button>
  ${post.name === currentUser ? `<button class="delete-btn" onclick="deletePost(${post.id})">Delete</button>` : ""}
</div>
      <div class="reaction-box">
  <button class="reaction-btn" onclick="reactPost(${post.id}, 'funny')">
  😂 Funny
  <span class="reaction-count">${post.reactions?.funny || 0}</span>
</button>

<button class="reaction-btn" onclick="reactPost(${post.id}, 'fire')">
  🔥 Fire
  <span class="reaction-count">${post.reactions?.fire || 0}</span>
</button>

<button class="reaction-btn" onclick="reactPost(${post.id}, 'love')">
  ❤️ Love
  <span class="reaction-count">${post.reactions?.love || 0}</span>
</button>

<button class="reaction-btn" onclick="reactPost(${post.id}, 'relatable')">
  😭 Relatable
  <span class="reaction-count">${post.reactions?.relatable || 0}</span>
</button>
      <div class="comment-box">
      <div class="comment-input-row">
  <input id="commentInput-${post.id}" type="text" placeholder="Comment as @${currentUser}..." />
  <button class="comment-btn" onclick="addComment(${post.id})">Send</button>
</div>
        

        <div class="comments-list">
          ${
            post.comments && post.comments.length > 0
              ? post.comments.map(comment => `
                  <div class="comment">
                    <b>@${comment.name}</b> ${comment.text}
                  </div>
                `).join("")
              : `<div class="no-comments">No comments yet. Be first.</div>`
          }
        </div>
      </div>
    </div>
  `).join("");
}

function renderLeaderboard() {
  const leaderboardBox = document.getElementById("leaderboardBox");
  const spotlightBox = document.getElementById("spotlightBox");

  if (posts.length === 0) {
    leaderboardBox.innerHTML = `<div class="empty">Leaderboard empty hai.</div>`;
    spotlightBox.innerHTML = "Abhi koi winner nahi. First post daalo!";
    return;
  }

  const sorted = [...posts].sort((a, b) => b.votes - a.votes);
  const topPost = sorted[0];

  leaderboardBox.innerHTML = sorted.slice(0, 5).map((post, index) => `
    <div class="leader-item">
      <span>${index + 1}. @${post.name} — ${post.category}</span>
      <b>${post.votes} 🔥</b>
    </div>
  `).join("");
}
function renderStats() {
  const totalPosts = posts.length;

  const totalVotes = posts.reduce((sum, post) => {
    return sum + post.votes;
  }, 0);

  const creators = new Set(posts.map(post => post.name.toLowerCase()));
  const totalCreators = creators.size;

  const totalComments = posts.reduce((sum, post) => {
    return sum + ((post.comments && post.comments.length) || 0);
  }, 0);

  document.getElementById("totalPosts").innerText = totalPosts;
  document.getElementById("totalVotes").innerText = totalVotes;
  document.getElementById("totalCreators").innerText = totalCreators;
  document.getElementById("totalComments").innerText = totalComments;
}
function renderPeople() {
  const peopleBox = document.getElementById("peopleBox");

  if (!peopleBox) {
    return;
  }

  if (posts.length === 0) {
    peopleBox.innerHTML = `<div class="empty">Abhi koi creator nahi.</div>`;
    return;
  }

  const peopleMap = {};

  posts.forEach(post => {
    const username = post.name.toLowerCase();

    if (!peopleMap[username]) {
      peopleMap[username] = {
        name: post.name,
        posts: 0,
        votes: 0,
        comments: 0,
        reactions: 0
      };
    }

    peopleMap[username].posts += 1;
    peopleMap[username].votes += post.votes || 0;
    peopleMap[username].comments += (post.comments && post.comments.length) || 0;

    const r = post.reactions || {
      funny: 0,
      fire: 0,
      love: 0,
      relatable: 0
    };

    peopleMap[username].reactions +=
      (r.funny || 0) +
      (r.fire || 0) +
      (r.love || 0) +
      (r.relatable || 0);
  });

  const people = Object.values(peopleMap).sort((a, b) => b.votes - a.votes);
  people.forEach(person => {
  person.spotlightPasses = spotlightPasses.filter(
    pass =>
      pass.givenTo.toLowerCase() ===
      person.name.toLowerCase()
  ).length;
});

  peopleBox.innerHTML = people.map(person => `
    <div class="people-card">
    <h3>
  @${person.name}
  ${
    person.name.toLowerCase() ===
    getSpotlightWinnerName().toLowerCase()
      ? " 👑"
      : ""
  }
</h3>
      <p>
        ${person.posts} posts • 
        ${person.votes} votes • 
        ${person.comments} comments • 
        ${person.reactions} reactions
      </p>
      <p>🌟 ${person.spotlightPasses || 0} Spotlight Passes today</p>

      <button class="view-profile-btn" onclick="openPeopleProfile('${person.name}')">
        View Profile
      </button>
      <button
  class="spotlight-pass-btn"
  onclick="giveSpotlightPass('${person.name}')"
>
  🌟 Give Spotlight Pass
</button>
    </div>
  `).join("");
}
function giveSpotlightPass(receiverName) {
  if (!currentUser) {
    alert("Pehle login karo.");
    return;
  }

  if (
    receiverName.toLowerCase() ===
    currentUser.toLowerCase()
  ) {
    alert("Khud ko Spotlight Pass nahi de sakti 😭");
    return;
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const passId =
    encodeURIComponent(currentUser.toLowerCase()) +
    "_" +
    today;

  db.collection("spotlightPasses")
    .doc(passId)
    .set({
      givenBy: currentUser,
      givenTo: receiverName,
      date: today,
      createdAt: new Date().toLocaleString()
    })
    .then(() => {
      alert(`🌟 Spotlight Pass @${receiverName} ko mil gaya!`);
    })
    .catch(error => {
      console.error("Spotlight Pass error:", error);
      alert("Spotlight Pass send nahi hua.");
    });
}
function getSpotlightWinnerName() {
  if (!spotlightPasses || spotlightPasses.length === 0) {
    return "";
  }

  const counts = {};

  spotlightPasses.forEach(pass => {
    const name = pass.givenTo;

    counts[name] = (counts[name] || 0) + 1;
  });

  return Object.keys(counts).sort(
    (a, b) => counts[b] - counts[a]
  )[0];
}
function openPeopleProfile(name) {
  document.getElementById("profileNameInput").value = name;
  showPage("profile");
  searchProfile();
}
function removeExpiredPosts() {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  posts = posts.filter(post => {
    return now - post.id < twentyFourHours;
  });

  savePosts();
}
function renderAll() {
  removeExpiredPosts();
  renderFeed();
 // renderBattle();
  renderLeaderboard();
  renderStats();
  renderSpotlightWinner();
  renderPeople();
}
function searchProfile() {
  const profileName = document.getElementById("profileNameInput").value.trim().toLowerCase();
  const profileBox = document.getElementById("profileBox");

  if (!profileName) {
    alert("Nickname enter karo.");
    return;
  }

  const userPosts = posts.filter(post => post.name.toLowerCase() === profileName);

  if (userPosts.length === 0) {
    profileBox.innerHTML = `<div class="empty">Is nickname se koi post nahi mila.</div>`;
    return;
  }

  const totalVotes = userPosts.reduce((sum, post) => sum + post.votes, 0);

  const totalComments = userPosts.reduce((sum, post) => {
    return sum + ((post.comments && post.comments.length) || 0);
  }, 0);

  const totalReactions = userPosts.reduce((sum, post) => {
    const r = post.reactions || {
      funny: 0,
      fire: 0,
      love: 0,
      relatable: 0
    };

    return sum + r.funny + r.fire + r.love + r.relatable;
  }, 0);

  const bestPost = [...userPosts].sort((a, b) => b.votes - a.votes)[0];

  profileBox.innerHTML = `
    <div class="profile-heading">
  @${profileName}'s Fame24 Profile
  ${
    profileName.toLowerCase() ===
    getSpotlightWinnerName().toLowerCase()
      ? " 👑"
      : ""
  }
</div>

    <div class="profile-stats">
      <div class="profile-stat">
        <h3>${userPosts.length}</h3>
        <p>Posts</p>
      </div>

      <div class="profile-stat">
        <h3>${totalVotes}</h3>
        <p>Votes</p>
      </div>

      <div class="profile-stat">
        <h3>${totalComments}</h3>
        <p>Comments</p>
      </div>

      <div class="profile-stat">
        <h3>${totalReactions}</h3>
        <p>Reactions</p>
      </div>
    </div>

    <div class="best-post">
      <h3>🏆 Best Post</h3>
      <p><b>${bestPost.category}</b></p>
      ${bestPost.image ? `<img src="${bestPost.image}" class="post-image" alt="Best post image">` : ""}
      <p>${bestPost.caption}</p>
      <p class="votes">${bestPost.votes} votes • ⏳ ${getTimeLeft(bestPost.id)}</p>
    </div>

    <div class="profile-heading">My Posts</div>

    ${userPosts.map(post => `
  <div class="post-card">

    <div class="post-top">
      <div>
        <div class="user">@${post.name}</div>

        <div class="votes">
          ${post.votes} votes • ⏳ ${getTimeLeft(post.id)}
        </div>
      </div>

      <div class="category">
        ${post.category}
      </div>
    </div>

    ${
      post.image
        ? `<img src="${post.image}" class="post-image" alt="Post image">`
        : ""
    }

    <div class="caption">
      ${post.caption}
    </div>

    <div class="living-post-box">

      <div class="living-title">
        🌱 This Moment is Growing
      </div>

      ${
        post.contributions &&
        post.contributions.filter(
          item => item.status === "accepted"
        ).length > 0

          ? post.contributions
              .filter(
                item => item.status === "accepted"
              )
              .map(item => `
                <div class="contribution-item">

                  <b>@${item.name}</b>

                  ${
                    item.text
                      ? `<span>${item.text}</span>`
                      : ""
                  }

                  ${
                    item.image
                      ? `
                        <img
                          src="${item.image}"
                          class="contribution-image"
                          alt="Moment contribution"
                        />
                      `
                      : ""
                  }

                </div>
              `)
              .join("")

          : `
            <div class="no-contributions">
              No approved moments yet.
            </div>
          `
      }

    </div>
    ${
  post.name === currentUser &&
  post.contributions &&
  post.contributions.some(
    item => item.status === "pending"
  )

    ? `
      <div class="pending-moments-box">

        <h4>⏳ Pending Moments</h4>

        ${
          post.contributions
            .map((item, index) => ({
              ...item,
              originalIndex: index
            }))
            .filter(
              item => item.status === "pending"
            )
            .map(item => `
              <div class="pending-moment">

                <b>@${item.name}</b>

                ${
                  item.text
                    ? `<p>${item.text}</p>`
                    : ""
                }

                <button onclick="approveContribution(${post.id}, ${item.originalIndex})">
                  ✅ Accept
                </button>

                <button onclick="rejectContribution(${post.id}, ${item.originalIndex})">
                  ❌ Reject
                </button>

              </div>
            `)
            .join("")
        }

      </div>
    `

    : ""
}

  </div>
`).join("")}

`;

}

checkLogin();
function renderBattle() {
  let savedBattle = JSON.parse(localStorage.getItem("currentBattle"));

let postA;
let postB;

if (savedBattle) {
  postA = posts.find(p => p.firebaseId === savedBattle.postA);
  postB = posts.find(p => p.firebaseId === savedBattle.postB);
}

if (!postA || !postB) {
  const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);

  postA = shuffledPosts[0];
  postB = shuffledPosts[1];

  localStorage.setItem(
    "currentBattle",
    JSON.stringify({
      postA: postA.firebaseId,
      postB: postB.firebaseId
    })
  );

  localStorage.removeItem("fame24BattleVote");
}
  const battlePage = document.getElementById("battlePage");

  if (!battlePage) return;

  if (posts.length < 2) {
    battlePage.innerHTML = `
      <div class="battle-header">
        <p>🔥 Blind Fame Battle</p>
        <h2>Battle waiting for more posts</h2>
        <span>At least 2 posts are needed.</span>
      </div>
    `;
    return;
  }

  battlePage.innerHTML = `
    <div class="battle-header">
      <p>🔥 Blind Fame Battle</p>
      <h2>Who deserves the spotlight?</h2>
      <span>Names and vote counts are hidden.</span>
    </div>

    <div class="battle-box">

      <div class="battle-post">
        <div class="battle-tag">POST A</div>

        <img
          src="${postA.image || 'https://via.placeholder.com/400'}"
          alt="Battle Post A"
        />

        <button
          class="battle-vote-btn"
          onclick="battleVote('${postA.firebaseId}', 'A')"
        >
          🔥 Vote A
        </button>
      </div>

      <div class="vs-circle">VS</div>

      <div class="battle-post">
        <div class="battle-tag">POST B</div>

        <img
          src="${postB.image || 'https://via.placeholder.com/400'}"
          alt="Battle Post B"
        />

        <button
          class="battle-vote-btn"
          onclick="battleVote('${postB.firebaseId}', 'B')"
        >
          🔥 Vote B
        </button>
      </div>

    </div>

    <div class="battle-timer">
      ⏳ Blind voting is live
    </div>
    <button class="result-btn" onclick="showBattleResult()">
  👑 Reveal Winner
</button>

<div id="battleResult" class="battle-result"></div>

<button class="new-battle-btn" onclick="startNewBattle()">
  ⚔️ Next Battle
</button>
  `;
}
function startNewBattle() {
  localStorage.removeItem("currentBattle");
  localStorage.removeItem("fame24BattleVote");

  //renderBattle();


}
function battleVote(firebaseId, side) {
  const votedBattle = localStorage.getItem("fame24BattleVote");

  if (votedBattle) {
    alert("Tum is battle me already vote kar chuki ho.");
    return;
  }

  db.collection("posts")
    .doc(firebaseId)
    .update({
      votes: firebase.firestore.FieldValue.increment(1)
    })
    .then(() => {
      localStorage.setItem("fame24BattleVote", side);
      alert(`Vote ${side} submitted 🔥`);
    })
    .catch(error => {
      console.error("Battle vote error:", error);
      alert("Vote submit nahi hua.");
    });
}
function showBattleResult() {
  if (posts.length < 2) {
    alert("Result ke liye kam se kam 2 posts chahiye.");
    return;
  }

  const postA = posts[0];
  const postB = posts[1];

  const votesA = postA.votes || 0;
  const votesB = postB.votes || 0;

  let winnerText = "";

  if (votesA > votesB) {
    winnerText = `
      🏆 POST A WINS!
      <br>
      Winner: ${postA.name}
      <br>
      ${votesA} votes
    `;
  } else if (votesB > votesA) {
    winnerText = `
      🏆 POST B WINS!
      <br>
      Winner: ${postB.name}
      <br>
      ${votesB} votes
    `;
  } else {
    winnerText = `
      ⚔️ IT'S A TIE!
      <br>
      Both posts got ${votesA} votes
    `;
  }

  document.getElementById("battleResult").innerHTML = winnerText;
}
function renderSpotlightWinner() {
  const spotlightBox = document.getElementById("spotlightBox");

  if (!spotlightBox) return;

  if (spotlightPasses.length === 0) {
    spotlightBox.innerHTML = `
      🌟 Aaj abhi kisi creator ko Spotlight Pass nahi mila.
    `;
    return;
  }

  const counts = {};

  spotlightPasses.forEach(pass => {
    const name = pass.givenTo;

    counts[name] = (counts[name] || 0) + 1;
  });

  const winnerName = Object.keys(counts).sort(
    (a, b) => counts[b] - counts[a]
  )[0];

  const winnerPasses = counts[winnerName];

  spotlightBox.innerHTML = `
    <div class="spotlight-winner">
      <h2>🌟 Spotlight Creator</h2>

      <h3>@${winnerName}</h3>

      <p>
        ${winnerPasses} Spotlight Passes today
      </p>

      <button onclick="openPeopleProfile('${winnerName}')">
        View Profile
      </button>
    </div>
  `;
}