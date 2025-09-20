import React, {useState} from 'react';
import Menu from './Menu';
import AddTextFile from './AddTextFile';
import AddMarkdownFile from './AddMarkdownFile';
import AddMediaFile from './AddMediaFile';
import AddImageURL from './AddImageURL';

export default function AddFile() {
  const [currentTab, setCurrentTab] = useState("add-markdown-file");

  return (
    <>
      <div className="container-fluid full-height">
        <div className="row full-height">
          <Menu />
          <div className="col-md-10 full-min-height p-5">
            <ul class="nav nav-tabs my-3">
              <li class="nav-item">
                <a class={(currentTab == "add-markdown-file") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("add-markdown-file")}>Add Markdown File</a>
              </li>
              <li class="nav-item">
                <a class={(currentTab == "add-text-file") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("add-text-file")}>Add Text File</a>
              </li>
              <li class="nav-item">
                <a class={(currentTab == "add-media-file") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("add-media-file")}>Add Media File</a>
              </li>
              <li class="nav-item">
                <a class={(currentTab == "add-image-url") ? "nav-link active" : "nav-link"} href="#" onClick={() => setCurrentTab("add-image-url")}>Add Image URL</a>
              </li>
              
            </ul>

          
            {currentTab == "add-markdown-file" &&
              <AddMarkdownFile />
            }
            {currentTab == "add-text-file" &&
              <AddTextFile />
            }
            
            <div className="row">
              <div className="col-md-2"></div>
              <div className="col-md-6">
                {currentTab == "add-media-file" &&
                <AddMediaFile />
                }
                {currentTab == "add-image-url" &&
                  <AddImageURL />
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
