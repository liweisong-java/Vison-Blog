package com.weisong.backend.entities;

/**
 * @author 李伟松
 * @create 2022-02-16-19:53
 */

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class Department {

    @Column(name="dep_id")
    Integer dep_id;

    @Column(name="departmentName")
    String departmentName;
}
