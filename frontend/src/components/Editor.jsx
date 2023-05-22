/* eslint-disable react-hooks/exhaustive-deps */
// @ts-nocheck
import styled from "@emotion/styled";
import { Avatar, Box, Input, List, ListItem, Typography } from "@mui/material";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import React, { useEffect,  useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

// Styled component for the main container
const Component = styled.div`
  background: #f5f5f5;
`;

// Quill toolbar options
var toolbarOptions = [
  ["bold", "italic", "underline", "strike"], // toggled buttons
  ["blockquote", "code-block"],
  [
    {
      header: 1,
    },
    {
      header: 2,
    },
  ], // custom button values
  [
    {
      list: "ordered",
    },
    {
      list: "bullet",
    },
  ],
  [
    {
      script: "sub",
    },
    {
      script: "super",
    },
  ], // superscript/subscript
  [
    {
      indent: "-1",
    },
    {
      indent: "+1",
    },
  ], // outdent/indent
  [
    {
      direction: "rtl",
    },
  ], // text direction
  ["link", "image", "video"],
  [
    {
      size: ["small", false, "large", "huge"],
    },
  ], // custom dropdown
  [
    {
      header: [1, 2, 3, 4, 5, 6],
    },
  ],
  [
    {
      color: [],
    },
    {
      background: [],
    },
  ], // dropdown with defaults from theme
  [
    {
      font: [],
    },
  ],
  [
    {
      align: [],
    },
  ],
  ["clean"], // remove formatting button
];
const Editor = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [isCopied, setIsCopied] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputWidth, setInputWidth] = useState(200); // Initial width
  const [documentName, setDocumentName] = useState("Google Docs");
  const currentUrl = window.location.href;
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedDocumentName = urlParams.get("documentName");
    if (savedDocumentName) {
      setDocumentName(savedDocumentName);
      setInputWidth(Math.max(200, savedDocumentName.length));
    } else {
      setDocumentName("Google Docs");
    }
  }, []);

  // Handle document name change
  const handleNameChange = (event) => {
    const newName = event.target.value;
    setDocumentName(newName);
    const urlParams = new URLSearchParams(window.location.search);
    newName
      ? urlParams.set("documentName", newName)
      : urlParams.delete("documentName");
    navigate(`?${urlParams.toString()}`);
    const newInputWidth = Math.max(200, newName.length*10);
    setInputWidth(newInputWidth);

    socket && socket.emit("update-document-name", newName);
  };

  const handleMouseLeave = () => {
    setIsInputFocused(false);
    if (!documentName) {
      setDocumentName("Google Docs");
    }
  };
  useEffect(() => {
    // Update document title when documentName changes
    if (documentName === "Google Docs") {
      document.title = "Google Docs";
    } else {
      document.title = `${documentName} - Google Docs`;
    }
  }, [documentName]);

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };
  const { id } = useParams();
  useEffect(() => {
    const quillServer = new Quill("#container", {
      modules: {
        toolbar: toolbarOptions,
      },
      theme: "snow",
    });
    quillServer.disable();
    quillServer.setText("You can start from here.......");
    setQuill(quillServer);
  }, []);

  useEffect(() => {
    //https://google-docs-backend-server.onrender.com/
    //http://localhost:8000
const socketServer = io("https://google-docs-backend-server.onrender.com/");

    setSocket(socketServer);
    return () => {
      socketServer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Send changes to the server
    if (socket === null || quill === null) return;

    const handleChange = (delta, oldData, source) => {
      if (source !== "user") return;

      socket && socket.emit("send-changes", delta);
    };

    quill && quill.on("text-change", handleChange);

    return () => {
      quill && quill.off("text-change", handleChange);
    };
  }, [quill, socket]);

  useEffect(() => {
    // Receive changes from the server
    if (socket === null || quill === null) return;

    const handleChange = (delta) => {
      quill.updateContents(delta);
    };

    socket && socket.on("recieve-changes", handleChange);

    return () => {
      socket && socket.off("recieve-changes", handleChange);
    };
  }, [quill, socket]);

  useEffect(() => {
    // Load document from the server
    if (socket === null || quill === null) return;

    socket &&
      socket.once("load-document", (document) => {
        quill && quill.setContents(document);
        quill && quill.enable();
      });
    socket && socket.emit("get-document", id);
  }, [quill, socket, id]);

  useEffect(() => {
    // Autosave document every 2 seconds
    if (socket === null || quill === null) return;

    const interval = setInterval(() => {
      socket && socket.emit("save-document", quill.getContents());
    }, 1500);
    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  return (
    <Component style={{ backgroundColor: "#F5F5F5" }}>
      {" "}
      {/* Document header */}
      <Box className="head">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            ml: "0.6",
          }}
        >
          {" "}
          {/* Google Docs icon */}
          <svg
            class="MuiSvgIcon-root MuiSvgIcon-fontSizeLarge"
            focusable="false"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path>
          </svg>
          {/* Document name input */}
          <Input
            size="lg"
            value={documentName}
            onChange={handleNameChange}
            onMouseLeave={handleMouseLeave}
            sx={{
              mt: 0.8,
              border: isInputFocused ? 0.5 : 0, // Set border to 0 when not focused
              mb: 0.5,
              font: 18,
              justifyContent: "center",
              width: inputWidth,
              "&:focus": {
                outline: "none",
                border: "0.5px solid",
              },
            }}
            disableUnderline
            onFocus={() => setIsInputFocused(true)}
            // Update focus state
            onBlur={() => setIsInputFocused(false)}
            // Update focus state
          />
        </Box>
        {/* Share button */}
        <CopyToClipboard text={currentUrl} onCopy={handleCopy}>
          <Box className="btn" onClick={handleCopy}>
            {" "}
            {isCopied ? (
              <Typography variant="h6">Copied!</Typography>
            ) : (
              <Typography variant="h6">Share</Typography>
            )}{" "}
          </Box>
        </CopyToClipboard>
        {/* User avatar */}
        <Box className="avatar">
          <a href="https://mail.google.com/">
            <Avatar
src = "https://img.freepik.com/premium-vector/avatar-profile-colorful-illustration-2_549209-82.jpg?w=2000"

              size="30"
              round={true}
            />
          </a>
        </Box>
      </Box>
      {/* Sidebar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <List sx={{ position: "fixed" }}>
          {" "}
          {/* Calendar */}
          <ListItem
            button
            component="a"
            href="https://calendar.google.com/calendar/u/0/r"
          >
            <Avatar
              alt="Notes"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/768px-Google_Calendar_icon_%282020%29.svg.png?20221106121915"
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
              }}
            />
          </ListItem>
          {/* Keep */}
          <ListItem button component="a" href="https://keep.google.com/">
            <Avatar
              alt="Notes"
              src="https://www.gstatic.com/companion/icon_assets/keep_2020q4v3_2x.png"
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
              }}
              variant="rounded"
            />
          </ListItem>
          {/* Tasks */}
          <ListItem button component="a" href="https://keep.google.com/">
            <Avatar
              alt="Add Task"
              src="https://www.gstatic.com/companion/icon_assets/tasks_2021_2x.png"
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
              }}
            />
          </ListItem>
          {/* Contacts */}
          <ListItem button component="a" href="https://contacts.google.com/">
            <Avatar
              alt="Contact"
              src="https://www.gstatic.com/companion/icon_assets/contacts_2022_2x.png"
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
              }}
            />
          </ListItem>
          {/* Maps */}
          <ListItem button component="a" href="https://www.google.com/maps">
            <Avatar
              alt="Google Maps"
              src="https://www.gstatic.com/companion/icon_assets/maps_v2_2x.png"
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
              }}
            />
          </ListItem>
        </List>
      </Box>
      {/* Editor container */}
      <Box Box className="container" id="container">
        You can start the typing...
      </Box>
    </Component>
  );
};
export default Editor;
