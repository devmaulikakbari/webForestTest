import React, { useState } from "react";
import axios from "axios";
import RepositoryList from "./RepositoryList";
import "./styles.css";
import "./search.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
function Search({setIsLogin}) {
  const [username, setUsername] = useState("");
  const [repositories, setRepositories] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState(null);
  const handleChange = (event) => {
    setUsername(event.target.value);
  };
  const loginToken = localStorage.getItem('token')

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
       await axios.get(
        `http://localhost:5000/api/user-repo/${username}`,
        {
          headers: {
            Authorization: loginToken,
          },
        }
      ).then((reposResponse)=>{
        setRepositories(
          reposResponse?.data?.totalRecord?.sort((a, b) => b.watchers_count - a.watchers_count)
        );
        setAvatarUrl(reposResponse?.data?.totalRecord?.[0]?.avatar_url);
        setError(null);
        toast.success(reposResponse?.data?.message || "API call successful!");

      }).catch((error)=>{
      setError("Error fetching data. Please try again.");
      toast.error(error?.data?.message || "Please Try After Sometime");
      })

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(error?.message || "Please Try After Sometime");
      setError("Error fetching data. Please try again.");
    }
  };

  return (
    <div className="container">
      <div className="container-end">
    <button className="btn btn-primary btn-submit" onClick={()=>{
      localStorage.clear();
      setIsLogin(false);
      toast.success("Logout successful");
    }}>
      LogOut
    </button>
      </div>
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="input-group">
          <input
            type="text"
            value={username}
            onChange={handleChange}
            className="form-control"
            placeholder="Enter GitHub username"
            required
          />
          <button type="submit" className="btn btn-primary btn-submit">
            Search
          </button>
        </div>
      </form>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="User avatar"
          className="avatar img-fluid rounded-circle mt-3"
        />
      )}
      {error && <p className="text-danger mt-3">{error}</p>}
      {
        repositories?.length > 1 && <RepositoryList repositories={repositories}  fetchRepo={handleSubmit}/>
      }
      {/* Pass repositories data to RepositoryList component */}
           <ToastContainer/>
    </div>
  );
}

export default Search;
