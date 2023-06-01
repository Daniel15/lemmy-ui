import { Component } from "inferno";
import {
  CreatePrivateMessage as CreatePrivateMessageI,
  GetPersonDetails,
  GetPersonDetailsResponse,
  GetSiteResponse,
  PrivateMessageResponse,
} from "lemmy-js-client";
import { Subscription } from "rxjs";
import { i18n } from "../../i18next";
import { InitialFetchRequest } from "../../interfaces";
import { UserService } from "../../services";
import {
  HttpService,
  RequestState,
  apiWrapper,
  apiWrapperIso,
} from "../../services/HttpService";
import {
  getRecipientIdFromProps,
  isBrowser,
  isInitialRoute,
  myAuth,
  setIsoData,
  toast,
} from "../../utils";
import { HtmlTags } from "../common/html-tags";
import { Spinner } from "../common/icon";
import { PrivateMessageForm } from "./private-message-form";

interface CreatePrivateMessageState {
  siteRes: GetSiteResponse;
  recipientRes: RequestState<GetPersonDetailsResponse>;
  recipientId: number;
  createMessageRes: RequestState<PrivateMessageResponse>;
}

export class CreatePrivateMessage extends Component<
  any,
  CreatePrivateMessageState
> {
  private isoData = setIsoData(this.context);
  private subscription?: Subscription;
  state: CreatePrivateMessageState = {
    siteRes: this.isoData.site_res,
    recipientRes: { state: "empty" },
    createMessageRes: { state: "empty" },
    recipientId: getRecipientIdFromProps(this.props),
  };

  constructor(props: any, context: any) {
    super(props, context);
    this.handlePrivateMessageCreate =
      this.handlePrivateMessageCreate.bind(this);

    if (!UserService.Instance.myUserInfo && isBrowser()) {
      toast(i18n.t("not_logged_in"), "danger");
      this.context.router.history.push(`/login`);
    }

    // Only fetch the data if coming from another route
    if (isInitialRoute(this.isoData, this.context)) {
      this.state = {
        ...this.state,
        recipientRes: apiWrapperIso(
          this.isoData.routeData[0] as GetPersonDetailsResponse
        ),
      };
    }
  }

  async componentDidMount() {
    if (!isInitialRoute(this.isoData, this.context)) {
      await this.fetchPersonDetails();
    }
  }

  async fetchPersonDetails() {
    this.setState({
      recipientRes: { state: "loading" },
    });

    this.setState({
      recipientRes: await apiWrapper(
        HttpService.client.getPersonDetails({
          person_id: this.state.recipientId,
          sort: "New",
          saved_only: false,
          auth: myAuth(),
        })
      ),
    });
  }

  static fetchInitialData(req: InitialFetchRequest): Promise<any>[] {
    let person_id = Number(req.path.split("/").pop());
    let form: GetPersonDetails = {
      person_id,
      sort: "New",
      saved_only: false,
      auth: req.auth,
    };
    return [req.client.getPersonDetails(form)];
  }

  get documentTitle(): string {
    if (this.state.recipientRes.state == "success") {
      let name_ = this.state.recipientRes.data.person_view.person.name;
      return `${i18n.t("create_private_message")} - ${name_}`;
    } else {
      return "";
    }
  }

  componentWillUnmount() {
    if (isBrowser()) {
      this.subscription?.unsubscribe();
    }
  }

  renderRecipientRes() {
    switch (this.state.recipientRes.state) {
      case "loading":
        return (
          <h5>
            <Spinner large />
          </h5>
        );
      case "success": {
        const res = this.state.recipientRes.data;
        return (
          <div className="row">
            <div className="col-12 col-lg-6 offset-lg-3 mb-4">
              <h5>{i18n.t("create_private_message")}</h5>
              <PrivateMessageForm
                onCreate={this.handlePrivateMessageCreate}
                recipient={res.person_view.person}
                loading={this.state.createMessageRes.state == "loading"}
              />
            </div>
          </div>
        );
      }
    }
  }

  render() {
    return (
      <div className="container-lg">
        <HtmlTags
          title={this.documentTitle}
          path={this.context.router.route.match.url}
        />
        {this.renderRecipientRes()}
      </div>
    );
  }

  async handlePrivateMessageCreate(form: CreatePrivateMessageI) {
    this.setState({ createMessageRes: { state: "loading" } });
    const createMessageRes = await apiWrapper(
      HttpService.client.createPrivateMessage(form)
    );
    this.setState({ createMessageRes });
    if (createMessageRes.state == "success") {
      toast(i18n.t("message_sent"));

      // Navigate to the front
      this.context.router.history.push("/");
    }
  }
}
