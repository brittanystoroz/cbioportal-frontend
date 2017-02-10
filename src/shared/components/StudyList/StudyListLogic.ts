import * as React from 'react';
import * as _ from 'lodash';
import {CancerTreeNode} from "../query/CancerStudyTreeData";
import {NodeMetadata} from "../query/CancerStudyTreeData";
import {TypeOfCancer as CancerType, CancerStudy} from "../../api/CBioPortalAPI";
import memoize from "../../lib/memoize";
import {QueryStore} from "../query/QueryStore";
import {computed, action} from "../../../../node_modules/mobx/lib/mobx";

export function matchesSearchText(input:string, searchText:string):boolean
{
	input = input.toLocaleLowerCase();
	searchText = searchText.toLocaleLowerCase();

	return searchText.split(' ').every(filter => {
		let desired = true;
		if (filter.startsWith('-'))
		{
			filter = filter.substr(1);
			desired = false;
		}

		let found = input.indexOf(filter) >= 0;
		return found == desired;
	});
}

export default class StudyListLogic
{
	constructor(readonly store:QueryStore)
	{
	}

	@computed get rootCancerType()
	{
		return this.store.treeData.rootCancerType;
	}

	getMetadata(node:CancerTreeNode)
	{
		return this.store.treeData.map_node_meta.get(node) as NodeMetadata;
	}

	// filters out empty CancerType subtrees
	shouldConsiderNode(node:CancerTreeNode)
	{
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
		{
			// ignore cancer types excluded by selection
			if (this.store.selectedCancerTypeIds.length)
			{
				let idToCancerType = (cancerTypeId:string) => this.store.treeData.map_cancerTypeId_cancerType.get(cancerTypeId) as CancerType;
				let selectedCancerTypes = this.store.selectedCancerTypeIds.map(idToCancerType);
				if (_.intersection(selectedCancerTypes, [node].concat(meta.ancestors)).length == 0)
					return false;
			}
			// ignore cancer types excluded by depth
			if (meta.ancestors.length > this.store.maxTreeDepth)
				return false;
			// ignore cancer types with no descendant studies
			if (meta.descendantStudies.length == 0)
				return false;
		}
		return true;
	}

	// returns true if the node or any related nodes match
	nodeFilter = memoize({
		getAdditionalArgs: () => [this.store.treeData, this.store.maxTreeDepth, this.store.searchText],
		fixedArgsLength: 1,
		function: (node:CancerTreeNode):boolean =>
		{
			//TODO this logic is broken - search for 'eas' and then select/deselect Breast cancer type to see bug

			let meta = this.getMetadata(node);

			if (!this.shouldConsiderNode(node))
				return false;

			// if no search text is entered, include all nodes
			if (!this.store.searchText)
				return true;

			// check for matching text in this node and related nodes
			for (let others of [[node], meta.descendantCancerTypes, meta.descendantStudies, meta.ancestors])
				for (let other of others)
					if (this.shouldConsiderNode(other) && matchesSearchText(other.name, this.store.searchText))
						return true;

			// no match
			return false;
		}
	});

	getChildCancerTypes(cancerType:CancerType):CancerType[]
	{
		let meta = this.getMetadata(cancerType);
		let childTypes = meta.ancestors.length < this.store.maxTreeDepth ? meta.childCancerTypes : [];
		return childTypes.filter(this.nodeFilter);
	}

	getChildCancerStudies(cancerType:CancerType):CancerStudy[]
	{
		let meta = this.getMetadata(cancerType);
		let studies = meta.ancestors.length < this.store.maxTreeDepth ? meta.childStudies : meta.descendantStudies;
		return studies.filter(this.nodeFilter);
	}

	getDescendantCancerStudies(node:CancerTreeNode):CancerStudy[]
	{
		if (node === this.rootCancerType)
			return this.hack_getAllStudies();

		let meta = this.getMetadata(node);
		return meta.descendantStudies.filter(this.nodeFilter);
	}

	getDepth(node:CancerType):number
	{
		let meta = this.getMetadata(node);
		return meta.ancestors.length;
	}

	isHighlighted(node:CancerTreeNode):boolean
	{
		return !!this.store.searchText && matchesSearchText(node.name, this.store.searchText);
	}

	getCheckboxProps(node: CancerTreeNode): {checked: boolean, indeterminate?: boolean}
	{
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
		{
			let selectedStudyIds = this.store.selectedStudyIds || [];
			let selectedStudies = selectedStudyIds.map(studyId => this.store.treeData.map_studyId_cancerStudy.get(studyId) as CancerStudy);
			let shownStudies = this.getDescendantCancerStudies(node);
			let shownAndSelectedStudies = _.intersection(shownStudies, selectedStudies);
			let checked = shownAndSelectedStudies.length > 0;
			let indeterminate = checked && shownAndSelectedStudies.length != shownStudies.length;

			return {checked, indeterminate};
		}
		else
		{
			let study = node as CancerStudy;
			let checked = !!this.store.selectedStudyIds.find(id => id == study.studyId);
			return {checked};
		}
	}

	hack_getAllStudies()
	{
		return _.union(...(
			this.getChildCancerTypes(this.rootCancerType)
				.map(cancerType => this.getDescendantCancerStudies(cancerType))
		));
	}

	@action hack_handleSelectAll(checked:boolean)
	{
		let selectedStudyIds = this.store.selectedStudyIds;
		let clickedStudyIds = this.hack_getAllStudies().map(study => study.studyId);
		if (checked)
			selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
		else
			selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);

		this.store.selectedStudyIds = selectedStudyIds;
	}

	@action onCheck(node:CancerTreeNode, checked:boolean): void
	{
		let clickedStudyIds:string[];
		let meta = this.getMetadata(node);
		if (meta.isCancerType)
			clickedStudyIds = this.getDescendantCancerStudies(node).map(study => study.studyId);
		else
			clickedStudyIds = [(node as CancerStudy).studyId];
		this.handleCheckboxStudyIds(clickedStudyIds, checked);
	}

	 private handleCheckboxStudyIds(clickedStudyIds:string[], checked:boolean)
	{
		let selectedStudyIds = this.store.selectedStudyIds;
		if (checked)
			selectedStudyIds = _.union(selectedStudyIds, clickedStudyIds);
		else
			selectedStudyIds = _.difference(selectedStudyIds, clickedStudyIds);

		this.store.selectedStudyIds = selectedStudyIds;
	}
}
