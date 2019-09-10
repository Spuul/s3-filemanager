import { QUploaderBase } from 'quasar'
import S3 from 'aws-sdk/clients/s3'

export default {
  name: 'QUploaderS3',
  props: {
    prefix: [Function, String],
    path: [Function, String],
    contentType: [Function, String],
    cacheControl: [Function, String],
    metadata: [Function, Array],
    credentials: Object,
    bucket: String,
    s3UploadOptions: {
      type: Object,
      default: {
        partSize: 5 * 1024 * 1024,
        queueSize: 4
      }
    },
    factory: Function
  },
  data () {
    return {
      workingThreads: 0
    }
  },
  mixins: [ QUploaderBase ],
  computed: {
    // [REQUIRED]
    // we're working on uploading files
    isUploading () {
      return this.workingThreads > 0
      // return <Boolean>
    },

    // [optional]
    // shows overlay on top of the
    // uploader signaling it's waiting
    // on something (blocks all controls)
    isBusy () {
      return this.workingThreads > 0
      //      return false
      // return this.promises.length > 0
      // return <Boolean>
    }
  },

  methods: {
    // [REQUIRED]
    // abort and clean up any process
    // that is in progress
    abort () {
      console.log('abort')
      // ...
    },

    // [REQUIRED]
    upload () {
      if (this.canUpload === false) {
        return
      }
      const s3 = new S3({ credentials: this.credentials, useAccelerateEndpoint: false })
      const queue = this.queuedFiles.slice(0)
      this.queuedFiles = []

      queue.forEach(file => {
        this.workingThreads++
        let params = {
          Bucket: this.bucket,
          Key: file.key,
          ContentType: file.type,
          Body: file
        }
        let options = this.s3UploadOptions
        s3.upload(params, options).on('httpUploadProgress', (evt) => {
          this.__updateFile(file, 'uploading', evt.loaded)
        })
          .send((err, data) => {
            if (err) {
              console.log(err)
            }
            this.uploadedSize += file.size
            this.workingThreads--
            this.__updateFile(file, 'uploaded')
            console.log('file', file)
          })
      })
    }
  }
}