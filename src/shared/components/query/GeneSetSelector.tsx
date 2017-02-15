import * as React from 'react';
import queryStore from "./QueryStore";
import * as styles_any from './styles.module.scss';
import ReactSelect from 'react-select';
import {observer} from "../../../../node_modules/mobx-react/index";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import gene_lists from './gene_lists';
import GeneSymbolValidator from "./GeneSymbolValidator";
import classNames from "../../lib/classNames";

const styles = styles_any as {
	GeneSetSelector: string,
	ReactSelect: string,
	geneSet: string,
	empty: string,
	notEmpty: string,
};

@observer
export default class GeneSetSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	render()
	{
		let options = gene_lists.map(item => ({
			label: `${item.id} (${item.genes.length} genes)`,
			value: item.genes.join(' ')
		}));
		options = [{
			label: 'User-defined List',
			value: ''
		}].concat(options);

		return (
			<FlexCol padded overflow className={styles.GeneSetSelector}>
				<h2>Enter Gene Set:</h2>
				<a href='/onco_query_lang_desc.jsp'>Advanced: Onco Query Language (OQL)</a>
				<ReactSelect
					className={styles.ReactSelect}
					value={this.store.geneQuery}
					options={options}
					onChange={(option:{value:string}) => this.store.geneQuery = option.value}
				/>

				<FlexRow padded>
					{!!(this.store.mutSigForSingleStudy.result.length) && (
						<button>Select from Recurrently Mutated Genes (MutSig)</button>
					)}
					{!!(this.store.gisticForSingleStudy.result.length) && (
						<button>Select Genes from Recurrent CNAs (Gistic)</button>
					)}
				</FlexRow>

				<textarea
					className={classNames(styles.geneSet, this.store.geneQuery ? styles.notEmpty : styles.empty)}
					rows={5}
					cols={80}
					placeholder="Enter HUGO Gene Symbols or Gene Aliases"
					title="Enter HUGO Gene Symbols or Gene Aliases"
					value={this.store.geneQuery}
					onChange={event => {
						this.store.geneQuery = (event.target as HTMLTextAreaElement).value;
					}}
				/>

				<GeneSymbolValidator/>
			</FlexCol>
		);
	}
}
