import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { api } from "./constants/api";
import { FaBook } from "react-icons/fa";
import { PlusIcon } from "@heroicons/react/24/outline";
import Todo from "./components/Todo";

const socket = io(api);

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    axios
      .get(`${api}/api/fetchAllTasks`)
      .then((response) => setTasks(response.data))
      .catch((error) => console.error("Error fetching tasks:", error));
  }, []);

  useEffect(() => {
    socket.on("newTask", (task) => {
      setTasks((prevTasks) => [...prevTasks, task]);
    });
    return () => {
      socket.off("newTask");
    };
  }, []);

  const handleAdd = () => {
    if (newTask.trim() === "") return;
    const taskObj = { task: newTask };
    socket.emit("add", taskObj);

    setTasks((prevTasks) => [...prevTasks, taskObj]);
    setNewTask("");
  };

  return (
    <div className="flex justify-center items-center h-screen px-4 py-4 box-border">
      <div className="w-full max-w-md h-[60vh] p-5 shadow-[0_0_10px_0_rgba(0,0,0,0.2)] mx-auto box-border px-2 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2">
          <FaBook className="text-amber-800 w-5 h-6" />
          <h1 className="text-2xl font-bold">Note App</h1>
        </div>

        {/* Input + Button */}
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <input
            placeholder="New Note"
            className="bg-white py-2 px-3 rounded-lg shadow-2xl border w-full flex-grow"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button
            className="bg-amber-800 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            onClick={handleAdd}
          >
            <PlusIcon className="w-5 h-5 text-amber-800 bg-white rounded-full p-1" />
            Add
          </button>
        </div>

        {/* Notes List - scrollable area that flexes */}
        <div className="mt-5 px-2 py-1 flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
          <h1 className="font-semibold">Notes</h1>
          {tasks.map((item, index) => (
            <Todo key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
