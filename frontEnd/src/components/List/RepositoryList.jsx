import React, { useEffect, useState } from "react";
import { FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import "./repositoryList.css";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

function RepositoryList({ repositories, fetchRepo }) {
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [sortedRepositories, setSortedRepositories] = useState([]);
  const [sortColumn, setSortColumn] = useState("name"); // 'name', 'description', or 'watchers_count'
  const loginToken = localStorage.getItem("token");
  const [isBack, setIsBack] = useState(false);

  useEffect(() => {
    setSortedRepositories([...repositories]);
  }, [repositories]);

  const handleSort = (column) => {
    const order =
      column === sortColumn ? (sortOrder === "asc" ? "desc" : "asc") : "asc";
    const sorted = [...repositories].sort((a, b) => {
      if (column === "name") {
        return order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (column === "description") {
        return order === "asc"
          ? (a.description || "").localeCompare(b.description || "")
          : (b.description || "").localeCompare(a.description || "");
      } else if (column === "watchers_count") {
        return order === "asc"
          ? a.watchers_count - b.watchers_count
          : b.watchers_count - a.watchers_count;
      } else {
        return order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
    });
    setSortedRepositories(sorted);
    setSortOrder(order);
    setSortColumn(column);
  };

  const renderSortIcon = (column) => {
    if (column === sortColumn) {
      return sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />;
    }
    return null;
  };

  const handleClick = () => {
    setIsBack(true);
    const data = [...sortedRepositories];
    const likedItems = data.filter((ele) => ele.islike);
    setSortedRepositories(likedItems);
  };

  const handleClearAll = () => {
    setIsBack(false);
    setSortedRepositories(repositories);
  };

  const handleCheck = async (repoId, event) => {
    await axios
      .post(
        `${process.env.REACT_APP_HOST}/api/favorite`,
        {
          repoId: repoId,
        },
        {
          headers: {
            Authorization: loginToken,
          },
        }
      )
      .then(async (response) => {
        toast.success(response?.data?.message);
        await fetchRepo(event);
      })
      .catch((error) => {
        toast.error(error?.message || "Please Try After Sometime");
      });
  };
  return (
    <div className="table-responsive">
      <table className="table table-striped custom-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => handleSort("name")}>
              Name {renderSortIcon("name")}
            </th>
            <th className="sortable" onClick={() => handleSort("description")}>
              Description {renderSortIcon("description")}
            </th>
            <th
              className="sortable"
              onClick={() => handleSort("watchers_count")}
            >
              Watchers {renderSortIcon("watchers_count")}
            </th>
            <th
              className="sortable"
              onClick={() => handleSort("watchers_count")}
            >
              Favorite
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRepositories?.map((repo, index) => {
            const { id } = repo;
            return (
              <tr key={id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                <td>{repo?.full_name}</td>
                <td>{repo?.description}</td>
                <td>{repo?.watchers_count}</td>
                <td>
                  {
                    <input
                      type="checkbox"
                      checked={repo.islike}
                      onClick={(e) => {
                        handleCheck(id, e);
                      }}
                    />
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="btn-wrapper">
        {isBack ? (
          <div className="favourite-action__wrapper" onClick={handleClearAll}>
            <button className="favourite__list_action">Back</button>
          </div>
        ) : (
          <div className="favourite-action__wrapper" onClick={handleClick}>
            <button className="favourite__list_action">Favorite List</button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

export default RepositoryList;
