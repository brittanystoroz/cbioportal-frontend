import * as _ from "lodash";
import * as React from "react";
import * as ReactBootstrap from 'react-bootstrap';
import Spinner from "react-spinkit";
import Dictionary = _.Dictionary;
import CancerStudySelector from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import Radio = ReactBootstrap.Radio;
import Checkbox = ReactBootstrap.Checkbox;
import {Select, StateToggle} from "../ExperimentalControls";
import * as styles_any from './styles.module.scss';
import GeneticProfileSelector from "./GeneticProfileSelector";
import {observer} from "../../../../node_modules/mobx-react/custom";
import queryStore from "./QueryStore";
import devMode from "../../lib/devMode";
import DataTypePrioritySelector from "./DataTypePrioritySelector";
import PatientCaseSetSelector from "./PatientCaseSetSelector";

const styles = styles_any as {
	QueryContainer: string,
	CancerStudySelector: string,
};

@observer
export default class QueryContainer extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

    render():JSX.Element
    {
        if (this.store.cancerTypes.isPending || this.store.cancerStudies.isPending)
            return <Spinner/>;
        if (!this.store.cancerTypes.result.length || !this.store.cancerStudies.result.length)
            return <span>No data</span>;

        return (
            <FlexRow padded flex={1} className={styles.QueryContainer}>

				<FlexCol padded overflow>
					<CancerStudySelector/>

					{!!(devMode.enabled && this.store.singleSelectedStudyId) && (
						<GeneticProfileSelector/>
					)}

					{!!(devMode.enabled && this.store.singleSelectedStudyId) && (
						<PatientCaseSetSelector/>
					)}

					{!!(devMode.enabled && !this.store.singleSelectedStudyId) && (
						<DataTypePrioritySelector/>
					)}
				</FlexCol>

				{!!(devMode.enabled) && (
					<FlexCol padded overflow>
						{/* demo controls */}
						<FlexCol padded style={{border: '1px solid #ddd', borderRadius: 5, padding: 5}}>
							<StateToggle label='Click tree node again to deselect' target={this.store} name='clickAgainToDeselectSingle' defaultValue={queryStore.clickAgainToDeselectSingle}/>
							<Select
								label="Tree depth: "
								selected={this.store.maxTreeDepth}
								options={[
									{label: "0"},
									{label: "1"},
									{label: "2"},
									{label: "3"},
									{label: "4"},
									{label: "5"},
									{label: "6"},
									{label: "7"},
									{label: "8"},
									{label: "9"},
								]}
								onChange={option => this.store.maxTreeDepth = parseInt(option.label)}
							/>
							<span>Note: Use cmd+click to select/deselect multiple cancer types.</span>
						</FlexCol>

						{/* display state for demo */}
						<pre>
							{JSON.stringify(this.store.stateToSerialize, null, 4)}
						</pre>
					</FlexCol>
				)}

            </FlexRow>
        );
    }
}
