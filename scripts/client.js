'use strict';

const e = React.createElement;

class LikeButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: false };
    }

    render() {
        if (this.state.liked) {
            return 'You liked this.';
        }

        return e(
            'button',
            { onClick: () => this.setState({ liked: true }) },
            'Like'
        );
    }
}

class LoginForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: '' };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        alert('A name was submitted: ' + this.state.value);
        event.preventDefault();
    }

    render() {
        return (
            <form className="form" onSubmit={this.handleSubmit}>
                <label>
                    Username:
                    <input type="text" value={this.state.value} onChange={this.handleChange} />
                </label>
                <input type="submit" value="Submit" />
            </form>
        );
    }
}

const domContainer = document.querySelector('#mainContainer');
ReactDOM.render(<LoginForm />, domContainer);
/*
var userLoggedIn = false;
var socket = io({ autoConnect: false });

var form = document.getElementById('form');
form.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log("logged in? " + userLoggedIn)
    if (!userLoggedIn && input.value) {
        console.log("logging in with cmd " + input.value)
        socket.auth = { cmd: input.value }
        socket.connect();
        input.value = '';
        userLoggedIn = true;
    } else if (input.value) {
        socket.emit('cmd', input.value);
        input.value = '';
    }
});

socket.on("connect_error", (err) => {
    if (err.message === "invalid username") {
        var item = document.createElement('li');
        item.textContent = 'Please join a session by using `!join -u=<username>`!';
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
        userLoggedIn = false;
    }
});

socket.on('response', function (msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

 var socket = io();
var input = document.getElementById('input');

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('cmd', input.value);
        input.value = '';
    }
});
socket.on('response', function (msg) {
    var item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}); */