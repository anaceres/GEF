/** @jsx React.DOM */
(function() {
"use strict";

var VERSION = "0.3.6";
var PT = React.PropTypes;
var ErrorPane = window.MyReact.ErrorPane;
var Files = window.MyReact.Files;

window.MyGEF = window.MyGEF || {};

var apiRootName = "/gef/api";
var apiNames = {
	datasets: apiRootName+"/datasets",
	createService: apiRootName+"/services",
};

function setState(state) {
	if (this && this != window && this.setState) {
		this.setState(state);
	}
}

var Main = React.createClass({
	getInitialState: function () {
		return {
			page: this.browseDatasets,
			errorMessages: [],
		};
	},

	error: function(errObj) {
		var err = "";
		if (typeof errObj === 'string' || errObj instanceof String) {
			err = errObj;
		} else if (typeof errObj === 'object' && errObj.statusText) {
			console.log("ERROR: jqXHR = ", errObj);
			err = errObj.statusText;
		} else {
			return;
		}

		var that = this;
		var errs = this.state.errorMessages.slice();
		errs.push(err);
		this.setState({errorMessages: errs});

		setTimeout(function() {
			var errs = that.state.errorMessages.slice();
			errs.shift();
			that.setState({errorMessages: errs});
		}, 10000);
	},

	ajax: function(ajaxObject) {
		var that = this;
		if (!ajaxObject.error) {
			ajaxObject.error = function(jqXHR, textStatus, error) {
				if (jqXHR.readyState === 0) {
					that.error("Network error, please check your internet connection");
				} else if (jqXHR.responseText) {
					that.error(jqXHR.responseText + " ("+error+")");
				} else  {
					that.error(error + " ("+textStatus+")");
				}
				console.log("ajax error, jqXHR: ", jqXHR);
			};
		}
		// console.log("ajax", ajaxObject);
		jQuery.ajax(ajaxObject);
	},

	browseDatasets: function() {
		return (
			<BrowseDatasets error={this.error} ajax={this.ajax} />
		);
	},

	executeService: function() {
		return (
			<ExecuteService error={this.error} ajax={this.ajax} />
		);
	},

	runningJobs: function() {
		return (
			<RunningJobs error={this.error} ajax={this.ajax} />
		);
	},

	createDataset: function() {
		return (
			<CreateDataset error={this.error} ajax={this.ajax} />
		);
	},

	createService: function() {
		return (
			<CreateService error={this.error} ajax={this.ajax} />
		);
	},

	renderToolListItem: function(pageFn, title) {
		var klass = "list-group-item " + (pageFn === this.state.page ? "active":"");
		return (
			<a href="#" className={klass} onClick={setState.bind(this, {page:pageFn})}>
				{title}
			</a>
		);
	},

	render: function() {
		return	(
			<div>
				<ErrorPane errorMessages={this.state.errorMessages} />
				<div className="container">
					<div className="row">
						<div className="col-xs-12 col-sm-2 col-md-2">
							<div className="list-group">
								{this.renderToolListItem(this.createService, "Create Service")}
								{this.renderToolListItem(this.executeService, "Execute Service")}
								{this.renderToolListItem(this.runningJobs, "Browse Jobs")}
							</div>
							<div className="list-group">
								{this.renderToolListItem(this.browseDatasets, "Browse Datasets")}
							</div>
						</div>
						<div className="col-xs-12 col-sm-10 col-md-10">
							{ this.state.page ? this.state.page() : false }
						</div>
					</div>
				</div>
			</div>
		);
	}
});

///////////////////////////////////////////////////////////////////////////////

function humanSize(sz) {
	if (sz < 1024) {
		return [sz,"B  "];
	} else if (sz < 1024 * 1024) {
		return [(sz/1024).toFixed(1), "KiB"];
	} else if (sz < 1024 * 1024 * 1024) {
		return [(sz/(1024*1024)).toFixed(1), "MiB"];
	} else if (sz < 1024 * 1024 * 1024 * 1024) {
		return [(sz/(1024*1024*1024)).toFixed(1), "GiB"];
	} else {
		return [(sz/(1024*1024*1024*1024)).toFixed(1), "TiB"];
	}
}

///////////////////////////////////////////////////////////////////////////////

var CreateService = React.createClass({
	var todo = (
		<ul>
			<li>Select base image</li>
			<li>Upload files</li>
			<li>Define inputs and outputs</li>
			<li>Execute command</li>
			<li>Test data</li>
			<li>Create</li>
		</ul>
	);
	render: function() {
		return (
			<div>
				<h3> Create Service </h3>
				<Files apiURL={apiNames.createService} error={this.props.error}
						cancel={function(){}} />
			</div>
		);
	},
});

///////////////////////////////////////////////////////////////////////////////

var ExecuteService = React.createClass({
	props: {
		error: PT.func.isRequired,
		ajax: PT.func.isRequired,
	},

	getInitialState: function() {
		return {
		};
	},

	render: function() {
		return (
			<div className="execute-service-page">
				<h3> Execute Service </h3>
			</div>
		);
	}
});

///////////////////////////////////////////////////////////////////////////////

var RunningJobs = React.createClass({
	render: function() {
		return (
			<div>
				<h3> RunningJobs </h3>
			</div>
		);
	},
});

///////////////////////////////////////////////////////////////////////////////

var CreateDataset = React.createClass({
	props: {
		error: PT.func.isRequired,
		ajax: PT.func.isRequired,
	},

	render: function() {
		return (
			<div>
				<h3> Create Dataset </h3>
				<p>Please select and upload all the files in your dataset</p>
				<Files apiURL={apiNames.datasets} error={this.props.error}
						cancel={function(){}} />
			</div>
		);
	},
});

///////////////////////////////////////////////////////////////////////////////

var BrowseDatasets = React.createClass({
	props: {
		error: PT.func.isRequired,
 		ajax: PT.func.isRequired,
	},

	getInitialState: function() {
		return {
			datasets: [],
		};
	},

	componentDidMount: function() {
		this.props.ajax({
			url: apiNames.datasets,
			success: function(json, textStatus, jqXHR) {
				if (!this.isMounted()) {
					return;
				}
				if (!json.datasets) {
					this.props.error("Didn't get json datasets from server");
					return;
				}
				this.setState({datasets: json.datasets});
			}.bind(this),
		});
	},

	renderHeads: function(dataset) {
		return (
			<div className="row table-head">
				<div className="col-xs-12 col-sm-5 col-md-5" >ID</div>
				<div className="col-xs-12 col-sm-2 col-md-2" style={{textAlign:'right'}}>Size</div>
				<div className="col-xs-12 col-sm-5 col-md-5" style={{textAlign:'right'}}>Date</div>
			</div>
		);
	},

	renderDataset: function(dataset) {
		var sz = humanSize(dataset.entry.size);
		return (
			<div className="row">
				<div key={dataset.id}>
					<div className="col-xs-12 col-sm-5 col-md-5" >{dataset.id}</div>
					<div className="col-xs-12 col-sm-2 col-md-2" style={{textAlign:'right'}}>{sz[0]} {sz[1]}</div>
					<div className="col-xs-12 col-sm-5 col-md-5" style={{textAlign:'right'}}>{new Date(dataset.entry.date).toLocaleString()}</div>
				</div>
			</div>
		);
	},

	render: function() {
		return (
			<div className="dataset-page">
				<h3> Browse Datasets </h3>
				{ this.renderHeads() }
				<div className="dataset-table">
					{ this.state.datasets.map(this.renderDataset) }
				</div>
			</div>
		);
	}
});

///////////////////////////////////////////////////////////////////////////////

var Footer = React.createClass({
	about: function(e) {
		main.about();
		e.preventDefault();
		e.stopPropagation();
	},

	render: function() {
		return	(
			<div className="container">
				<div className="row">
					<div className="col-xs-12 col-sm-6 col-md-6">
						<p>	<img width="45" height="31" src="images/flag-ce.jpg" style={{float:'left', marginRight:10}}/>
							EUDAT receives funding from the European Union’s Horizon 2020 research
							and innovation programme under grant agreement No. 654065.&nbsp;
							<a href="#">Legal Notice</a>.
						</p>
					</div>
					<div className="col-xs-12 col-sm-6 col-md-6 text-right">
						<ul className="list-inline pull-right" style={{marginLeft:20}}>
							<li><span style={{color:'#173b93', fontWeight:'500'}}> GEF v.{VERSION}</span></li>
						</ul>
						<ul className="list-inline pull-right">
							<li><a target="_blank" href="http://eudat.eu/what-eudat">About EUDAT</a></li>
							<li><a href="https://github.com/GEFx">Go to GitHub</a></li>
							<li><a href="mailto:emanuel.dima@uni-tuebingen.de">Contact</a></li>
						</ul>
					</div>
				</div>
			</div>
		);
	}
});

window.MyGEF.main = React.render(<Main />,  document.getElementById('page'));
window.MyGEF.footer = React.render(<Footer />, document.getElementById('footer') );

})();