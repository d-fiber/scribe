// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/foundation/protocol/database/database.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

class Operation extends $pb.ProtobufEnum {
  static const Operation OPERATION_UNSPECIFIED =
      Operation._(0, _omitEnumNames ? '' : 'OPERATION_UNSPECIFIED');
  static const Operation OPERATION_SELECT =
      Operation._(1, _omitEnumNames ? '' : 'OPERATION_SELECT');
  static const Operation OPERATION_INSERT =
      Operation._(2, _omitEnumNames ? '' : 'OPERATION_INSERT');
  static const Operation OPERATION_UPDATE =
      Operation._(3, _omitEnumNames ? '' : 'OPERATION_UPDATE');
  static const Operation OPERATION_UPSERT =
      Operation._(4, _omitEnumNames ? '' : 'OPERATION_UPSERT');
  static const Operation OPERATION_DELETE =
      Operation._(5, _omitEnumNames ? '' : 'OPERATION_DELETE');
  static const Operation OPERATION_RPC =
      Operation._(6, _omitEnumNames ? '' : 'OPERATION_RPC');

  static const $core.List<Operation> values = <Operation>[
    OPERATION_UNSPECIFIED,
    OPERATION_SELECT,
    OPERATION_INSERT,
    OPERATION_UPDATE,
    OPERATION_UPSERT,
    OPERATION_DELETE,
    OPERATION_RPC,
  ];

  static final $core.List<Operation?> _byValue =
      $pb.ProtobufEnum.$_initByValueList(values, 6);
  static Operation? valueOf($core.int value) =>
      value < 0 || value >= _byValue.length ? null : _byValue[value];

  const Operation._(super.value, super.name);
}

class FilterOperator extends $pb.ProtobufEnum {
  static const FilterOperator FILTER_OPERATOR_UNSPECIFIED =
      FilterOperator._(0, _omitEnumNames ? '' : 'FILTER_OPERATOR_UNSPECIFIED');
  static const FilterOperator FILTER_OPERATOR_EQ =
      FilterOperator._(1, _omitEnumNames ? '' : 'FILTER_OPERATOR_EQ');
  static const FilterOperator FILTER_OPERATOR_NEQ =
      FilterOperator._(2, _omitEnumNames ? '' : 'FILTER_OPERATOR_NEQ');
  static const FilterOperator FILTER_OPERATOR_GT =
      FilterOperator._(3, _omitEnumNames ? '' : 'FILTER_OPERATOR_GT');
  static const FilterOperator FILTER_OPERATOR_GTE =
      FilterOperator._(4, _omitEnumNames ? '' : 'FILTER_OPERATOR_GTE');
  static const FilterOperator FILTER_OPERATOR_LT =
      FilterOperator._(5, _omitEnumNames ? '' : 'FILTER_OPERATOR_LT');
  static const FilterOperator FILTER_OPERATOR_LTE =
      FilterOperator._(6, _omitEnumNames ? '' : 'FILTER_OPERATOR_LTE');
  static const FilterOperator FILTER_OPERATOR_LIKE =
      FilterOperator._(7, _omitEnumNames ? '' : 'FILTER_OPERATOR_LIKE');
  static const FilterOperator FILTER_OPERATOR_ILIKE =
      FilterOperator._(8, _omitEnumNames ? '' : 'FILTER_OPERATOR_ILIKE');
  static const FilterOperator FILTER_OPERATOR_IN =
      FilterOperator._(9, _omitEnumNames ? '' : 'FILTER_OPERATOR_IN');
  static const FilterOperator FILTER_OPERATOR_IS =
      FilterOperator._(10, _omitEnumNames ? '' : 'FILTER_OPERATOR_IS');
  static const FilterOperator FILTER_OPERATOR_CONTAINS =
      FilterOperator._(11, _omitEnumNames ? '' : 'FILTER_OPERATOR_CONTAINS');
  static const FilterOperator FILTER_OPERATOR_CONTAINED_BY = FilterOperator._(
      12, _omitEnumNames ? '' : 'FILTER_OPERATOR_CONTAINED_BY');
  static const FilterOperator FILTER_OPERATOR_OVERLAPS =
      FilterOperator._(13, _omitEnumNames ? '' : 'FILTER_OPERATOR_OVERLAPS');
  static const FilterOperator FILTER_OPERATOR_TEXT_SEARCH =
      FilterOperator._(14, _omitEnumNames ? '' : 'FILTER_OPERATOR_TEXT_SEARCH');

  static const $core.List<FilterOperator> values = <FilterOperator>[
    FILTER_OPERATOR_UNSPECIFIED,
    FILTER_OPERATOR_EQ,
    FILTER_OPERATOR_NEQ,
    FILTER_OPERATOR_GT,
    FILTER_OPERATOR_GTE,
    FILTER_OPERATOR_LT,
    FILTER_OPERATOR_LTE,
    FILTER_OPERATOR_LIKE,
    FILTER_OPERATOR_ILIKE,
    FILTER_OPERATOR_IN,
    FILTER_OPERATOR_IS,
    FILTER_OPERATOR_CONTAINS,
    FILTER_OPERATOR_CONTAINED_BY,
    FILTER_OPERATOR_OVERLAPS,
    FILTER_OPERATOR_TEXT_SEARCH,
  ];

  static final $core.List<FilterOperator?> _byValue =
      $pb.ProtobufEnum.$_initByValueList(values, 14);
  static FilterOperator? valueOf($core.int value) =>
      value < 0 || value >= _byValue.length ? null : _byValue[value];

  const FilterOperator._(super.value, super.name);
}

const $core.bool _omitEnumNames =
    $core.bool.fromEnvironment('protobuf.omit_enum_names');
