class AudioStreamProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = new Float32Array();
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];

        // Si nous avons des données dans notre buffer, les copier vers la sortie
        if (this.buffer.length >= channel.length) {
            channel.set(this.buffer.slice(0, channel.length));
            this.buffer = this.buffer.slice(channel.length);
        }

        return true;
    }
}

registerProcessor('audio-stream-processor', AudioStreamProcessor);
