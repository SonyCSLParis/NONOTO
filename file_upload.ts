require('jquery-simple-upload');

// let serverConfig: object = require('./config.json');
// let serverUrl = `http://${serverConfig['server_ip']}:${serverConfig['chorale_port']}/`;
// let serverUrl = 'http://localhost:5001/'

let useFineUpload: boolean = false;
export function createWavInput(urlLoadfile, onSuccess: Function): void {
  if (useFineUpload) {
      import('fine-uploader')
      .then(qq => {
          console.log(qq)
          require('fine-uploader/fine-uploader/fine-uploader-gallery.css')
          let gallery_template: string = require('fine-uploader/all.fine-uploader/templates/gallery.html')
          let fineUploadGalleryTemplateElement: HTMLElement = document.createElement('div')
          document.body.appendChild(fineUploadGalleryTemplateElement)
          fineUploadGalleryTemplateElement.innerHTML = gallery_template

          let uploaderDiv: HTMLDivElement = document.createElement('div');
          uploaderDiv.id = 'uploader';
          document.body.appendChild(uploaderDiv);

          var uploader = new qq.FineUploader({
                      element: document.getElementById("uploader")
                  });
      }
  )
  }
  else {
      let simpleUpload: HTMLDivElement = document.createElement('div')
      simpleUpload.id = 'simple-upload'
      document.body.appendChild(simpleUpload);
      let simpleUpload_html: string =
          `<div id="filename"></div>
          <div id="progress"></div>
          <div id="progressBar"></div>
          <input type="file" name="upload" accept="audio/x-wav" id="wav-input"/>`

      simpleUpload.innerHTML = simpleUpload_html;

      $('#wav-input').change(function() {
          ($(this) as any).simpleUpload(urlLoadfile, {
              start: function(file){
        				//upload started
        				$('#filename').html(file.name);
        				$('#progress').html("");
        				$('#progressBar').width(0);
  			       },

          			progress: function(progress){
          				//received progress
          				$('#progress').html("Progress: " + Math.round(progress) + "%");
          				$('#progressBar').width(progress + "%");
          			},

          			success: function(data){
          				//upload successful
          				$('#progress').html("Success!<br>Data: " + data);
                  onSuccess(data)
          			},

          			error: function(error){
          				//upload failed
          				$('#progress').html("Failure!<br>" + error.name + ": " + error.message);
          			}
          })
  	});
  }
}
